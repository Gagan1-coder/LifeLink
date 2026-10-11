# backend/app/services/sms_service.py
import datetime
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

def build_emergency_sms_text(
    emergency_type: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    accuracy: Optional[float] = None,
    user_name: Optional[str] = None,
) -> str:
    timestamp_str = datetime.datetime.now().strftime("%d-%b-%Y %I:%M %p")
    location_str = "Unavailable"
    maps_link = "No GPS link available"
    accuracy_str = ""

    if latitude is not None and longitude is not None:
        location_str = f"{latitude:.6f}, {longitude:.6f}"
        maps_link = f"https://www.google.com/maps?q={latitude:.6f},{longitude:.6f}"
        if accuracy is not None:
            accuracy_str = f" (Accuracy: ±{round(accuracy)}m)"

    sender_prefix = f"EMERGENCY ALERT from {user_name}!" if user_name else "EMERGENCY SOS ALERT!"

    return (
        f"🚨 {sender_prefix}\n"
        f"Situation: {emergency_type}\n"
        f"Time: {timestamp_str}\n"
        f"Location: {location_str}{accuracy_str}\n"
        f"Map: {maps_link}\n"
        f"Immediate medical assistance requested via LifeLink."
    )

async def send_emergency_sms(
    phone_number: str,
    emergency_type: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    accuracy: Optional[float] = None,
    user_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Sends emergency SMS using the configured provider or returns a simulated dispatch log
    if no carrier credentials are provided. Never falsely claims delivery.
    """
    message_text = build_emergency_sms_text(emergency_type, latitude, longitude, accuracy, user_name)
    cleaned_phone = phone_number.strip().replace(" ", "").replace("-", "")

    # Check for Fast2SMS (Indian SMS Gateway)
    if settings.SMS_PROVIDER == "fast2sms" and settings.FAST2SMS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Fast2SMS quick transactional SMS
                headers = {
                    "authorization": settings.FAST2SMS_API_KEY,
                    "Content-Type": "application/json"
                }
                # Remove +91 for standard Indian domestic API
                raw_number = cleaned_phone.replace("+91", "")
                payload = {
                    "route": "q",
                    "message": message_text,
                    "language": "english",
                    "flash": 0,
                    "numbers": raw_number,
                }
                resp = await client.post("https://www.fast2sms.com/dev/bulkV2", json=payload, headers=headers)
                data = resp.json()
                if resp.status_code == 200 and data.get("return") is True:
                    return {
                        "status": "sent",
                        "provider": "fast2sms",
                        "recipient": cleaned_phone,
                        "request_id": data.get("request_id"),
                        "message_preview": message_text,
                        "timestamp": datetime.datetime.now().isoformat(),
                    }
                else:
                    return {
                        "status": "failed",
                        "provider": "fast2sms",
                        "recipient": cleaned_phone,
                        "error": data.get("message", "Fast2SMS dispatch rejected"),
                        "message_preview": message_text,
                    }
        except Exception as e:
            return {
                "status": "failed",
                "provider": "fast2sms",
                "recipient": cleaned_phone,
                "error": str(e),
                "message_preview": message_text,
            }

    # Check for Twilio
    if settings.SMS_PROVIDER == "twilio" and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            async with httpx.AsyncClient(timeout=10.0) as client:
                data = {
                    "From": settings.TWILIO_FROM_NUMBER,
                    "To": cleaned_phone,
                    "Body": message_text,
                }
                resp = await client.post(
                    twilio_url,
                    data=data,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                )
                if resp.status_code in [200, 201]:
                    res_json = resp.json()
                    return {
                        "status": "sent",
                        "provider": "twilio",
                        "recipient": cleaned_phone,
                        "sid": res_json.get("sid"),
                        "message_preview": message_text,
                        "timestamp": datetime.datetime.now().isoformat(),
                    }
                else:
                    return {
                        "status": "failed",
                        "provider": "twilio",
                        "recipient": cleaned_phone,
                        "error": resp.text,
                        "message_preview": message_text,
                    }
        except Exception as e:
            return {
                "status": "failed",
                "provider": "twilio",
                "recipient": cleaned_phone,
                "error": str(e),
                "message_preview": message_text,
            }

    # Safe Simulation / Unconfigured Provider Mode for College Prototype
    return {
        "status": "simulated",
        "provider": "local_simulation",
        "provider_configured": False,
        "recipient": cleaned_phone,
        "note": "SMS Provider NOT CONFIGURED with live API key. Alert generated in local demo verification mode.",
        "message_preview": message_text,
        "timestamp": datetime.datetime.now().isoformat(),
    }
