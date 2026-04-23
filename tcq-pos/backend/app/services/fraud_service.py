"""
TCQ POS — Fraud Prevention Service
Email validation, disposable domain detection, and registration security.
"""

import re
import logging
from app.utils.disposable_domains import is_disposable_email, validate_email_domain

logger = logging.getLogger(__name__)

# RFC 5322 compliant email regex (simplified but robust)
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)


class FraudService:
    """
    Anti-fraud validation for user registration.
    
    Checks performed:
    1. Email format validation (RFC 5322)
    2. Disposable/temporary email domain detection
    3. Common abuse pattern detection
    """

    @staticmethod
    def validate_registration_email(email: str) -> tuple[bool, str]:
        """
        Full validation pipeline for registration emails.
        Returns (is_valid, error_message_or_empty).
        """
        if not email:
            return False, "Email is required"

        email = email.strip().lower()

        # Step 1: Format validation
        if not EMAIL_REGEX.match(email):
            return False, "Invalid email format"

        # Step 2: Disposable domain check
        is_valid, message = validate_email_domain(email)
        if not is_valid:
            logger.warning(f"🚨 Blocked disposable email registration: {email}")
            return False, message

        # Step 3: Abuse pattern detection
        local_part = email.split("@")[0]

        # Check for excessive dots/special chars (common in generated emails)
        if local_part.count(".") > 4:
            logger.warning(f"🚨 Suspicious email pattern: {email}")
            return False, "Email address appears to be auto-generated"

        # Check for very long local parts (often bot-generated)
        if len(local_part) > 64:
            return False, "Email local part is too long"

        # Check for all-numeric local parts (often temporary)
        if local_part.replace(".", "").replace("-", "").replace("_", "").isdigit():
            logger.warning(f"🚨 All-numeric email blocked: {email}")
            return False, "Email address appears to be auto-generated"

        return True, ""

    @staticmethod
    def validate_registration(
        email: str,
        full_name: str,
        password: str,
    ) -> tuple[bool, list[str]]:
        """
        Complete registration validation.
        Returns (is_valid, list_of_errors).
        """
        errors = []

        # Email validation
        is_email_valid, email_error = FraudService.validate_registration_email(email)
        if not is_email_valid:
            errors.append(email_error)

        # Name validation
        if not full_name or len(full_name.strip()) < 2:
            errors.append("Full name must be at least 2 characters")
        
        if full_name and any(char.isdigit() for char in full_name):
            errors.append("Full name should not contain numbers")

        return len(errors) == 0, errors
