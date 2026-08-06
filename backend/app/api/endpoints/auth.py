from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.db.models import User
from app.schemas import ForgotPasswordRequest, ResetPasswordWithOtp, UserCreate, Token
from app.services.email_service import (
    generate_otp,
    generate_verification_token,
    send_password_reset_otp,
    send_verification_email,
)

router = APIRouter()
PASSWORD_RESET_OTP_EXPIRE_MINUTES = 10


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    hashed_password = security.get_password_hash(user_in.password)
    verification_token = generate_verification_token()

    skip_verify = not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASS, settings.SMTP_FROM])

    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
        age=user_in.age,
        medical_history=user_in.medical_history,
        specialization=user_in.specialization,
        hospital_name=user_in.hospital_name,
        is_verified=False,
        email_verification_token=verification_token,
    )
    db.add(db_user)
    db.flush()

    send_err = ""
    if skip_verify:
        db_user.is_verified = True
        db_user.email_verification_token = None
    else:
        ok, err_detail = await send_verification_email(db_user.email, db_user.full_name, verification_token)
        send_err = err_detail
        # If SMTP delivery fails, fall back to auto-verify so users can still log in.
        # Verification still requires email when delivery is working.
        if not ok:
            db_user.is_verified = True
            db_user.email_verification_token = None

    db.commit()
    db.refresh(db_user)

    result: Dict[str, Any] = {
        "id": db_user.id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role.value if hasattr(db_user.role, "value") else str(db_user.role),
        "is_active": db_user.is_active,
        "is_verified": db_user.is_verified,
        "created_at": db_user.created_at,
    }

    if db_user.email_verification_token:
        result["verification_link"] = f"{settings.FRONTEND_URL}/auth/verify-email?token={db_user.email_verification_token}"

    if send_err:
        result["email_warning"] = (
            "We couldn't deliver your verification email. "
            "Check your SMTP/Brevo settings. "
            "We auto-verified this account so you can still log in immediately."
        )
        result["email_error_detail"] = send_err

    return result


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox or request a new verification link.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.email,
            expires_delta=access_token_expires,
            extra_claims={
                "id": user.id,
                "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                "full_name": user.full_name,
            },
        ),
        "token_type": "bearer",
    }


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(token: str = Query(..., description="Email verification token"), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link.",
        )
    user.is_verified = True
    user.email_verification_token = None
    db.commit()
    return {
        "detail": "Email verified successfully. You can now sign in.",
        "email": user.email,
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    response = {"detail": "If an account exists with this email, a password reset OTP has been sent."}
    if not user:
        return response

    otp = generate_otp()
    user.password_reset_otp_hash = security.get_password_hash(otp)
    user.password_reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=PASSWORD_RESET_OTP_EXPIRE_MINUTES
    )
    db.commit()

    sent, err = await send_password_reset_otp(user.email, user.full_name, otp)
    if not sent:
        response["email_warning"] = "We couldn't deliver your password reset OTP. Check your SMTP/Brevo settings."
        response["email_error_detail"] = err
    return response


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordWithOtp, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    user = db.query(User).filter(User.email == payload.email).first()
    invalid_otp_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired OTP.",
    )
    if not user or not user.password_reset_otp_hash or not user.password_reset_otp_expires_at:
        raise invalid_otp_error

    expires_at = user.password_reset_otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        user.password_reset_otp_hash = None
        user.password_reset_otp_expires_at = None
        db.commit()
        raise invalid_otp_error

    if not security.verify_password(payload.otp, user.password_reset_otp_hash):
        raise invalid_otp_error

    user.hashed_password = security.get_password_hash(payload.password)
    user.password_reset_otp_hash = None
    user.password_reset_otp_expires_at = None
    db.commit()
    return {"detail": "Password reset successfully. You can now sign in."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(email: str = Query(..., description="Account email"), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"detail": "If an account exists with this email, a new verification link has been sent."}
    if user.is_verified:
        return {"detail": "This email is already verified."}

    new_token = user.email_verification_token or generate_verification_token()
    user.email_verification_token = new_token
    db.commit()

    sent = False
    err = ""
    smtp_configured = all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASS, settings.SMTP_FROM])
    if smtp_configured:
        sent, err = await send_verification_email(user.email, user.full_name, new_token)
    else:
        sent = True

    payload: Dict[str, Any] = {
        "detail": "If an account exists with this email, a new verification link has been sent.",
    }
    if not sent and smtp_configured:
        # Fallback: auto-verify so user can continue despite broken SMTP setup
        user.is_verified = True
        user.email_verification_token = None
        db.commit()
        payload["detail"] = (
            "We couldn't deliver your verification email (SMTP/Brevo misconfigured). We auto-verified your account so you can sign in immediately."
        )
        payload["email_error_detail"] = err
    elif sent and user.email_verification_token:
        payload["verification_link"] = f"{settings.FRONTEND_URL}/auth/verify-email?token={user.email_verification_token}"

    return payload


@router.post("/admin-verify", status_code=status.HTTP_200_OK, include_in_schema=False)
def debug_admin_verify(
    email: str = Query(..., description="Email to force-verify"),
    db: Session = Depends(get_db),
):
    """Hidden debug endpoint — allows manually verifying an account without a verification email.

    For development/testing usage only; restrict in production by removing this endpoint or
    adding role-gating.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account with that email was found.")
    was_verified = user.is_verified
    user.is_verified = True
    user.email_verification_token = None
    db.commit()
    return {
        "detail": "Account verified." if not was_verified else "Account was already verified.",
        "email": user.email,
    }
