import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    Send password reset email via SMTP.
    In development, this logs the token instead of sending.
    """
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"

    subject = "Recuperar contrasena - Contable"
    body = f"""
    <html>
    <body>
        <h2>Recuperar Contrasena</h2>
        <p>Se ha solicitado un restablecimiento de contrasena para su cuenta.</p>
        <p>Haga clic en el siguiente enlace para restablecer su contrasena:</p>
        <a href="{reset_url}">Restablecer Contrasena</a>
        <p>Este enlace expirara en {settings.RESET_TOKEN_EXPIRE_MINUTES} minutos.</p>
        <p>Si no solicito esto, ignore este correo.</p>
    </body>
    </html>
    """

    if not settings.SMTP_HOST or settings.SMTP_HOST == "localhost":
        logger.info(
            f"[DEV] Password reset email for {email}. Token: {reset_token}"
        )
        return True

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart("alternative")
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = email
        message["Subject"] = subject
        message.attach(MIMEText(body, "html"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=settings.SMTP_USE_TLS,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        return False
