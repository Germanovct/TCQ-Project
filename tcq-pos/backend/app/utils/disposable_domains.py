"""
TCQ POS — Disposable Email Domain Blocklist
Prevents registration with temporary/throwaway email services.
"""

# Curated list of the most common disposable email domains
# Source: aggregated from multiple blocklists
DISPOSABLE_DOMAINS = {
    # Major disposable services
    "guerrillamail.com", "guerrillamail.de", "guerrillamail.net",
    "guerrillamail.org", "guerrillamailblock.com",
    "tempmail.com", "temp-mail.org", "temp-mail.io",
    "throwaway.email", "throwawaymail.com",
    "mailinator.com", "mailinator2.com",
    "yopmail.com", "yopmail.fr", "yopmail.net",
    "10minutemail.com", "10minutemail.net",
    "minutemail.com",
    "trashmail.com", "trashmail.de", "trashmail.net",
    "sharklasers.com", "guerrillamail.info",
    "dispostable.com",
    "maildrop.cc",
    "fakeinbox.com", "fakemail.net",
    "mailnesia.com",
    "tempail.com",
    "emailondeck.com",
    "getnada.com", "nada.email",
    "mohmal.com",
    "burnermail.io",
    "discard.email",
    "33mail.com",
    "mailsac.com",
    "harakirimail.com",
    "crazymailing.com",
    "tempr.email",
    "disposableemailaddresses.emailmiser.com",
    "mytemp.email",
    "tempinbox.com",
    "jetable.org",
    "mailcatch.com",
    "spamgourmet.com",
    "mailexpire.com",
    "incognitomail.org",
    "deadaddress.com",
    "eyepaste.com",
    "getairmail.com",
    "filzmail.com",
    "grr.la",
    "spam4.me",
    "tmail.ws",
    "tmpmail.net",
    "tmpmail.org",
    "binkmail.com",
    "bobmail.info",
    "chammy.info",
    "devnullmail.com",
    "dingbone.com",
    "dodsi.com",
    "emz.net",
    "fleckens.hu",
    "jourrapide.com",
    "letthemeatspam.com",
    "maileater.com",
    "mailforspam.com",
    "mailmoat.com",
    "mailnull.com",
    "meltmail.com",
    "mintemail.com",
    "mt2015.com",
    "nobulk.com",
    "nospamfor.us",
    "owlpic.com",
    "proxymail.eu",
    "rcpt.at",
    "rejectmail.com",
    "rhyta.com",
    "safersignup.de",
    "sharklasers.com",
    "shieldedmail.com",
    "sogetthis.com",
    "spamfree24.org",
    "spaml.de",
    "tradermail.info",
    "trash-mail.at",
    "trickmail.net",
    "wegwerfmail.de",
    "wegwerfmail.net",
    "wh4f.org",
    "wimsg.com",
    "zippymail.info",
}


def is_disposable_email(email: str) -> bool:
    """
    Check if an email address uses a disposable/temporary domain.
    Returns True if the domain is blacklisted.
    """
    if not email or "@" not in email:
        return True

    domain = email.split("@")[1].lower().strip()
    return domain in DISPOSABLE_DOMAINS


def validate_email_domain(email: str) -> tuple[bool, str]:
    """
    Validate an email's domain against the disposable blocklist.
    Returns (is_valid, message).
    """
    if not email or "@" not in email:
        return False, "Invalid email format"

    domain = email.split("@")[1].lower().strip()

    if domain in DISPOSABLE_DOMAINS:
        return False, f"Registration with disposable email domains ({domain}) is not allowed"

    # Additional heuristic checks
    if len(domain) < 4:
        return False, "Invalid email domain"

    return True, "Email domain is valid"
