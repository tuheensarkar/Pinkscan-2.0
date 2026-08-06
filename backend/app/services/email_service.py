import asyncio
import logging
import secrets
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr
from typing import Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_verification_token() -> str:
    return secrets.token_urlsafe(48)


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_email(email: str, subject: str, text: str, html: str) -> Tuple[bool, str]:
    try:
        _, sender_email = parseaddr(settings.SMTP_FROM)
        if not sender_email:
            return False, "SMTP_FROM must include a valid sender email address."

        message = EmailMessage()
        message["From"] = settings.SMTP_FROM
        message["To"] = email
        message["Subject"] = subject
        message.set_content(text)
        message.add_alternative(html, subtype="html")

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
            smtp.send_message(message, from_addr=sender_email, to_addrs=[email])

        logger.info("SMTP email sent to %s via %s", email, settings.SMTP_HOST)
        return True, ""
    except Exception as exc:
        err_str = str(exc)
        logger.error("SMTP send FAILED to %s via %s: %s", email, settings.SMTP_HOST, err_str)
        return False, err_str


def _send_verification_email_smtp(email: str, full_name: Optional[str], token: str) -> Tuple[bool, str]:
    """Send verification email using SMTP."""
    verify_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
    name = full_name or "there"
    subject = "Verify your email for PinkScan"
    html = f"""
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
  <div style="background: linear-gradient(90deg, #F62477, #FF0052); padding: 24px; border-radius: 10px 10px 0 0; color: white;">
    <h2 style="margin: 0; font-size: 22px;">Welcome to PinkScan</h2>
  </div>
  <div style="background: #fffafc; padding: 32px; border: 1px solid #e5d3dc; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #24323a;">
      Hi {name},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #24323a;">
      Thanks for creating a PinkScan account. Please verify your email address
      to start using your workspace.
    </p>
    <p style="text-align: center; margin: 0 0 24px;">
      <a href="{verify_url}" style="background: linear-gradient(90deg, #F62477, #FF0052); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
        Verify my email
      </a>
    </p>
    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #647071; word-break: break-all;">
      If the button above doesn't work, copy and paste this link into your browser:<br/>
      <a href="{verify_url}" style="color: #F62477;">{verify_url}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e5d3dc; margin: 28px 0 16px;" />
    <p style="margin: 0; font-size: 12px; color: #647071;">
      If you did not create a PinkScan account, you can safely ignore this email.
    </p>
  </div>
</div>
"""
    text = (
        f"Hi {name},\n\n"
        "Thanks for creating a PinkScan account. Please verify your email address "
        f"by opening this link:\n\n{verify_url}\n\n"
        "If you did not create a PinkScan account, you can safely ignore this email."
    )
    return _send_email(email, subject, text, html)


def _send_password_reset_otp_smtp(email: str, full_name: Optional[str], otp: str) -> Tuple[bool, str]:
    name = full_name or "there"
    subject = "Your PinkScan password reset OTP"
    html = f"""
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
  <div style="background: linear-gradient(90deg, #F62477, #FF0052); padding: 24px; border-radius: 10px 10px 0 0; color: white;">
    <h2 style="margin: 0; font-size: 22px;">PinkScan password reset</h2>
  </div>
  <div style="background: #fffafc; padding: 32px; border: 1px solid #e5d3dc; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #24323a;">Hi {name},</p>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #24323a;">
      Use this one-time password to reset your PinkScan password. It expires in 10 minutes.
    </p>
    <p style="margin: 0 0 24px; text-align: center;">
      <span style="display: inline-block; letter-spacing: 8px; background: #ffffff; border: 1px solid #e5d3dc; border-radius: 8px; padding: 14px 20px; font-size: 28px; font-weight: 700; color: #24323a;">{otp}</span>
    </p>
    <p style="margin: 0; font-size: 12px; color: #647071;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  </div>
</div>
"""
    text = (
        f"Hi {name},\n\n"
        f"Use this one-time password to reset your PinkScan password: {otp}\n"
        "It expires in 10 minutes.\n\n"
        "If you did not request a password reset, you can safely ignore this email."
    )
    return _send_email(email, subject, text, html)


async def send_verification_email(email: str, full_name: Optional[str], token: str) -> Tuple[bool, str]:
    """Returns (ok, error_message). If SMTP is not configured, returns (True, "")."""
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASS, settings.SMTP_FROM]):
        logger.info("SMTP settings incomplete; skipping verification email send to %s", email)
        return True, ""
    return await asyncio.to_thread(_send_verification_email_smtp, email, full_name, token)


async def send_password_reset_otp(email: str, full_name: Optional[str], otp: str) -> Tuple[bool, str]:
    """Returns (ok, error_message). If SMTP is not configured, returns (True, "")."""
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASS, settings.SMTP_FROM]):
        logger.info("SMTP settings incomplete; skipping password reset OTP send to %s", email)
        return True, ""
    return await asyncio.to_thread(_send_password_reset_otp_smtp, email, full_name, otp)
