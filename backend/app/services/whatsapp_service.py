# backend/app/services/whatsapp_service.py
import urllib.parse
import datetime
from typing import Dict, Any, Optional

def build_whatsapp_alert_payload(
    phone_number: str,
    emergency_type: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    accuracy: Optional[float] = None,
    user_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Builds structured WhatsApp emergency payload and web/app intent deep-link.
    """
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

    message_body = (
        f"🚨 *{sender_prefix}*\n\n"
        f"⚠️ *Emergency Situation:* {emergency_type}\n"
        f"⏰ *Time:* {timestamp_str}\n"
        f"📍 *GPS Location:* {location_str}{accuracy_str}\n\n"
        f"🗺️ *Live Google Maps:* {maps_link}\n\n"
        f"🆘 *Action Required:* Please dispatch medical help or contact emergency responders immediately via LifeLink AI."
    )

    # Clean phone number for WhatsApp wa.me link (needs country code without + or dashes)
    cleaned_phone = phone_number.strip().replace(" ", "").replace("-", "").replace("+", "")
    encoded_text = urllib.parse.quote(message_body)
    wa_url = f"https://wa.me/{cleaned_phone}?text={encoded_text}"
    wa_universal = f"https://api.whatsapp.com/send?phone={cleaned_phone}&text={encoded_text}"

    return {
        "status": "ready_to_share",
        "recipient": phone_number,
        "cleaned_recipient": cleaned_phone,
        "whatsapp_url": wa_url,
        "whatsapp_universal_url": wa_universal,
        "message_body": message_body,
        "disclaimer": "Opening WhatsApp creates a prefilled message. Recipient delivery depends on user tapping send.",
        "timestamp": datetime.datetime.now().isoformat(),
    }
