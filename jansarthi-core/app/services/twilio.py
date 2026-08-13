"""OTP service using 2Factor.in API."""

import logging
import re
from typing import Optional, Tuple

import requests

from app.settings.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def _masked_phone(phone: str) -> str:
    normalized = normalize_phone_number(phone)
    return f"***{normalized[-4:]}"


def normalize_phone_number(phone: str) -> str:
    """
    Normalize phone number to E.164 format
    
    Args:
        phone: Phone number in various formats
        
    Returns:
        str: Phone number in E.164 format (+[country_code][number])
        
    Examples:
        "9876543210" -> "+919876543210"
        "+919876543210" -> "+919876543210"
        "919876543210" -> "+919876543210"
        "+91 98765 43210" -> "+919876543210"
    """
    # Remove all non-digit characters except leading +
    if phone.startswith('+'):
        # Keep the + and remove all non-digits after it
        country_code_part = '+'
        phone = phone[1:]
        phone = re.sub(r'\D', '', phone)
        phone = country_code_part + phone
    else:
        # Remove all non-digits
        phone = re.sub(r'\D', '', phone)
        
        # If doesn't start with country code, assume India (+91)
        if not phone.startswith('91') or len(phone) == 10:
            phone = '91' + phone
        
        # Add + prefix
        phone = '+' + phone
    
    return phone


class OTPService:
    """Service for sending and verifying OTP via 2Factor.in API"""

    BASE_URL = "https://2factor.in/API/V1"

    def __init__(self):
        """Initialize OTP service with API key"""
        self.api_key = settings.otp_service_api_key

    def send_otp(self, to_number: str) -> Tuple[bool, Optional[str]]:
        """
        Send OTP via SMS using 2Factor.in API
        
        Args:
            to_number: Recipient phone number (will be normalized to E.164 format)
            
        Returns:
            Tuple[bool, Optional[str]]: (success, session_id)
                - success: True if sent successfully, False otherwise
                - session_id: Session ID to use for verification (None if failed)
                  In dev mode, returns "dev_mode" as session_id
        """
        # Development mode - skip actual OTP sending
        if settings.dev_mode:
            logger.info("DEV_MODE OTP requested for %s", _masked_phone(to_number))
            return True, "dev_mode"
        
        try:
            # Normalize phone number to E.164 format
            normalized_number = normalize_phone_number(to_number)
            
            # Build the API URL
            url = f"{self.BASE_URL}/{self.api_key}/SMS/{normalized_number}/AUTOGEN/OTP1"
            
            response = requests.get(url, timeout=settings.otp_http_timeout_seconds)
            response.raise_for_status()
            data = response.json()
            
            if data.get("Status") == "Success":
                session_id = data.get("Details")
                logger.info("OTP sent successfully to %s", _masked_phone(normalized_number))
                return True, session_id
            else:
                logger.warning(
                    "OTP provider rejected request for %s: %s",
                    _masked_phone(normalized_number),
                    data.get("Details", "unknown error"),
                )
                return False, None
                
        except Exception as error:
            logger.error(
                "OTP delivery failed for %s (%s)",
                _masked_phone(to_number),
                type(error).__name__,
            )
            return False, None

    def verify_otp(self, session_id: str, otp_code: str) -> bool:
        """
        Verify OTP using 2Factor.in API
        
        Args:
            session_id: Session ID received when OTP was sent
            otp_code: OTP code entered by user
            
        Returns:
            bool: True if OTP is valid, False otherwise
        """
        # Development mode - verify against default OTP
        if settings.dev_mode or session_id == "dev_mode":
            return otp_code == settings.dev_default_otp
        
        try:
            # Build the API URL
            url = f"{self.BASE_URL}/{self.api_key}/SMS/VERIFY/{session_id}/{otp_code}"
            
            response = requests.get(url, timeout=settings.otp_http_timeout_seconds)
            response.raise_for_status()
            data = response.json()
            
            if data.get("Status") == "Success" and data.get("Details") == "OTP Matched":
                return True
            else:
                logger.warning("OTP provider rejected a verification attempt")
                return False
                
        except Exception as error:
            logger.error("OTP verification request failed (%s)", type(error).__name__)
            return False


# Singleton instance
_otp_service = None


def get_otp_service() -> OTPService:
    """Get OTP service instance"""
    global _otp_service
    if _otp_service is None:
        _otp_service = OTPService()
    return _otp_service


# Backward compatibility aliases
TwilioService = OTPService
get_twilio_service = get_otp_service
