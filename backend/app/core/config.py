# backend/app/core/config.py
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "LifeLink AI Emergency Healthcare Coordinator"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SMS Configuration (Fast2SMS / Twilio)
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "simulated")  # "fast2sms", "twilio", or "simulated"
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "")
    FAST2SMS_API_KEY: str = os.getenv("FAST2SMS_API_KEY", "")
    
    # WhatsApp Configuration
    WHATSAPP_PROVIDER: str = os.getenv("WHATSAPP_PROVIDER", "user_initiated")  # "official_business" or "user_initiated"
    
    # Google Maps / Overpass API
    MAPS_API_KEY: str = os.getenv("MAPS_API_KEY", "")
    
    # Agentic AI LLM Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
