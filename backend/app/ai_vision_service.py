import os
import json
import logging
from typing import Optional, Dict, Any
from PIL import Image

logger = logging.getLogger(__name__)

# Structured Prompt for Business Card Extraction
SYSTEM_INSTRUCTION = """You are an expert AI business card parser.
Analyze the business card image provided and extract the contact details with high precision.
Follow these rules strictly:
1. 'full_name': The actual person's name (e.g. 'Michael Michel'). Do not confuse slogans, company names, or greetings with the person's name.
2. 'job_title': Their official position or role (e.g. 'General Manager', 'Chief Executive Officer').
3. 'company': The organization, hotel, brand, or business name (e.g. 'Ibis Vientiane Nam Phu', 'Accor').
4. 'phone': Primary phone or mobile number with international dialing code if visible.
5. 'email': The person's direct email address.
6. 'website': Company or personal website URL (normalize to start with https:// if missing).
7. 'address': Full physical or mailing address including city, country, or postal box.
8. 'notes': Any secondary information, accreditations, or services mentioned.

Return ONLY a valid JSON object matching the requested schema. If a field is not on the card, return an empty string."""

def extract_card_with_gemini(image_path: str) -> Optional[Dict[str, Any]]:
    """
    Extract business card details using Google Gemini Multimodal Vision AI.
    Returns parsed dictionary if successful, or None if API key missing or error occurs.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.info("GEMINI_API_KEY is not set. Falling back to local OCR.")
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Open image using Pillow
        image = Image.open(image_path)

        # Use gemini-2.5-flash for cutting-edge multimodal vision speed & precision
        # Falls back gracefully to gemini-1.5-flash if needed
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.1,
            response_mime_type="application/json",
        )

        response = client.models.generate_content(
            model=model_name,
            contents=[image, "Extract all contact details from this business card into structured JSON."],
            config=config,
        )

        if not response or not response.text:
            logger.warning("Empty response from Gemini Vision.")
            return None

        # Clean JSON response
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed = json.loads(raw_text.strip())

        # Normalize fields
        cleaned_card = {
            "full_name": str(parsed.get("full_name") or "").strip(),
            "job_title": str(parsed.get("job_title") or "").strip(),
            "company": str(parsed.get("company") or "").strip(),
            "phone": str(parsed.get("phone") or "").strip(),
            "email": str(parsed.get("email") or "").strip(),
            "website": str(parsed.get("website") or "").strip(),
            "address": str(parsed.get("address") or "").strip(),
            "notes": str(parsed.get("notes") or "").strip(),
            "ai_extracted": True,
        }

        # Build raw text fallback summary
        raw_summary = f"{cleaned_card['full_name']}\n{cleaned_card['job_title']}\n{cleaned_card['company']}\n{cleaned_card['phone']}\n{cleaned_card['email']}"
        cleaned_card["raw_text"] = raw_summary

        logger.info(f"Successfully extracted card using Gemini AI: {cleaned_card['full_name']}")
        return cleaned_card

    except Exception as e:
        logger.error(f"Gemini Vision extraction failed: {e}. Falling back to OCR.")
        return None


def generate_followup_message(card: Dict[str, Any], context: str = "") -> Optional[str]:
    """
    Generate a personalized networking follow-up message using Gemini.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

        name = card.get("full_name") or "there"
        title = card.get("job_title") or ""
        company = card.get("company") or ""

        prompt = f"""Write a concise, professional follow-up networking email to:
Name: {name}
Title: {title}
Company: {company}
Additional Context: {context or 'Connected recently through a business card exchange.'}

Keep it under 100 words, warm, professional, and ready to send. Include Subject line and Body."""

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )

        return response.text.strip() if response and response.text else None
    except Exception as e:
        logger.error(f"Follow-up generation failed: {e}")
        return None
