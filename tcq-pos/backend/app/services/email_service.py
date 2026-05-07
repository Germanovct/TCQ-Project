import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings
import asyncio

logger = logging.getLogger(__name__)
settings = get_settings()

class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL

    async def send_ticket_email(self, to_email: str, ticket_data: dict):
        """
        Sends an email with the ticket QR code and info.
        """
        if not self.user or not self.password:
            logger.warning("⚠️ SMTP_USER or SMTP_PASSWORD not set. Skipping real email sending.")
            return False

        subject = f"🎟️ Tu entrada para {ticket_data['event_name']} — TCQ"
        
        # HTML Template
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <div style="background-color: #000000; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0;">TCQ CLUB</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <h2 style="color: #333;">¡Hola {ticket_data['purchaser_name']}!</h2>
                    <p style="color: #666; font-size: 16px;">Tu entrada ha sido confirmada con éxito.</p>
                    
                    <div style="margin: 30px 0; padding: 20px; border: 2px dashed #ddd; border-radius: 10px;">
                        <h3 style="margin-top: 0; color: #000;">{ticket_data['event_name']}</h3>
                        <p style="margin: 5px 0; color: #888;">{ticket_data['ticket_type']}</p>
                        <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
                            <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">CÓDIGO DE ACCESO</p>
                            <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px;">{ticket_data['qr_code']}</p>
                        </div>
                        <p style="font-size: 14px; color: #666;">Presentá este código en la entrada del evento.</p>
                    </div>
                    
                    <div style="text-align: left; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                        <p style="font-size: 12px; color: #888;"><strong>Fecha de compra:</strong> {ticket_data['date']}</p>
                        <p style="font-size: 12px; color: #888;"><strong>Email:</strong> {to_email}</p>
                    </div>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; font-size: 12px; color: #999;">
                        ¿Querés ver tus entradas en el celular? <br>
                        Ingresá a <a href="https://tcqlub.com" style="color: #007bff; text-decoration: none;">tcqlub.com</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Run smtplib in a separate thread to not block the event loop
        return await asyncio.to_thread(self._send_sync, to_email, subject, html)

    def _send_sync(self, to_email: str, subject: str, html_content: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))

            # Titan works best with SSL on 465
            try:
                with smtplib.SMTP_SSL(self.host, self.port, timeout=10) as server:
                    server.login(self.user, self.password)
                    server.send_message(msg)
            except Exception as e:
                logger.warning(f"⚠️ SMTP_SSL failed, trying 587 STARTTLS... Error: {e}")
                with smtplib.SMTP(self.host, 587, timeout=10) as server:
                    server.starttls()
                    server.login(self.user, self.password)
                    server.send_message(msg)
            
            logger.info(f"✅ Email enviado con éxito a {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Error crítico enviando email: {e}")
            return False

email_service = EmailService()
