import asyncio
import logging
import secrets
from email.utils import parseaddr
from typing import Optional, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_email(email: str, subject: str, text: str, html: str) -> Tuple[bool, str]:
    try:
        sender_name, sender_email = parseaddr(settings.SMTP_FROM)
        if not sender_email:
            return False, "SMTP_FROM must include a valid sender email address."

        payload = {
            "sender": {"name": sender_name or "PinkScan", "email": sender_email},
            "to": [{"email": email}],
            "subject": subject,
            "htmlContent": html,
            "textContent": text,
        }
        headers = {
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json",
        }

        response = httpx.post(BREVO_API_URL, json=payload, headers=headers, timeout=30)

        if response.status_code >= 400:
            err_str = f"Brevo API returned {response.status_code}: {response.text}"
            logger.error("Brevo API send FAILED to %s: %s", email, err_str)
            return False, err_str

        logger.info("Email sent to %s via Brevo API", email)
        return True, ""
    except Exception as exc:
        err_str = str(exc)
        logger.error("Brevo API send FAILED to %s: %s", email, err_str)
        return False, err_str


def _send_verification_otp_smtp(email: str, full_name: Optional[str], otp: str) -> Tuple[bool, str]:
    """Send email verification OTP via Brevo's HTTP API."""
    name = full_name or "there"
    subject = "Your PinkScan verification code"
    html = f"""
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
  <div style="background: linear-gradient(90deg, #F62477, #FF0052); padding: 24px; border-radius: 10px 10px 0 0; color: white;">
    <h2 style="margin: 0; font-size: 22px;">Welcome to PinkScan</h2>
  </div>
  <div style="background: #fffafc; padding: 32px; border: 1px solid #e5d3dc; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #24323a;">
      Hi {name},
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #24323a;">
      Thanks for creating a PinkScan account. Use this code to verify your email address. It expires in 10 minutes.
    </p>
    <p style="margin: 0 0 24px; text-align: center;">
      <span style="display: inline-block; letter-spacing: 8px; background: #ffffff; border: 1px solid #e5d3dc; border-radius: 8px; padding: 14px 20px; font-size: 28px; font-weight: 700; color: #24323a;">{otp}</span>
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
        "Thanks for creating a PinkScan account. Use this code to verify your email address: "
        f"{otp}\n\nIt expires in 10 minutes.\n\n"
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


async def send_verification_otp(email: str, full_name: Optional[str], otp: str) -> Tuple[bool, str]:
    """Returns (ok, error_message). If Brevo API is not configured, returns (True, "")."""
    if not all([settings.BREVO_API_KEY, settings.SMTP_FROM]):
        logger.info("Brevo API key not configured; skipping verification OTP send to %s", email)
        return True, ""
    return await asyncio.to_thread(_send_verification_otp_smtp, email, full_name, otp)


async def send_password_reset_otp(email: str, full_name: Optional[str], otp: str) -> Tuple[bool, str]:
    """Returns (ok, error_message). If Brevo API is not configured, returns (True, "")."""
    if not all([settings.BREVO_API_KEY, settings.SMTP_FROM]):
        logger.info("Brevo API key not configured; skipping password reset OTP send to %s", email)
        return True, ""
    return await asyncio.to_thread(_send_password_reset_otp_smtp, email, full_name, otp)