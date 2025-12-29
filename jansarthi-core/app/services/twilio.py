"""OTP service using 2Factor.in API"""

import re
from typing import Optional, Tuple

import requests

from app.settings.config import get_settings

settings = get_settings()


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
        """
        try:
            # Normalize phone number to E.164 format
            normalized_number = normalize_phone_number(to_number)
            
            # Build the API URL
            url = f"{self.BASE_URL}/{self.api_key}/SMS/{normalized_number}/AUTOGEN/OTP1"
            
            response = requests.get(url)
            data = response.json()
            
            if data.get("Status") == "Success":
                session_id = data.get("Details")
                print(f"OTP sent successfully to {normalized_number}. Session ID: {session_id}")
                return True, session_id
            else:
                print(f"Failed to send OTP to {normalized_number}. Response: {data}")
                return False, None
                
        except Exception as e:
            print(f"Error sending OTP to {to_number}: {str(e)}")
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
        try:
            # Build the API URL
            url = f"{self.BASE_URL}/{self.api_key}/SMS/VERIFY/{session_id}/{otp_code}"
            
            response = requests.get(url)
            data = response.json()
            
            if data.get("Status") == "Success" and data.get("Details") == "OTP Matched":
                print(f"OTP verified successfully for session: {session_id}")
                return True
            else:
                print(f"OTP verification failed. Response: {data}")
                return False
                
        except Exception as e:
            print(f"Error verifying OTP: {str(e)}")
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
