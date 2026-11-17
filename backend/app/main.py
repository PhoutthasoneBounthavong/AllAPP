import os
import json
import csv
import io
import uuid
import re
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Response, status, Depends, BackgroundTasks
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field, ConfigDict
from PIL import Image

from app.database import get_db_connection, init_db
from app.ocr_service import process_card_image
from app.vcard_service import generate_vcard_content
from app.qr_service import generate_qr_code_image
from app.ai_vision_service import extract_card_with_gemini, generate_followup_message
from app.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_optional,
    get_current_user_required,
)

# Guard against decompression bomb attacks in PIL
Image.MAX_IMAGE_PIXELS = 50_000_000

app = FastAPI(
    title="Business Contact & Cardr Platform API",
    description="Apple HIG-inspired Business Card Scanner & Digital Business Card Platform",
    version="1.0.0"
)

# Allowed CORS origins
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()] if env_origins else DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    body = await request.body()
    print(f"!!! 422 VALIDATION ERROR on {request.url}: {exc.errors()}, Body: {body.decode(errors='ignore')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

# Ensure upload directories exist
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
CARDS_DIR = os.path.join(UPLOADS_DIR, "cards")
AVATARS_DIR = os.path.join(UPLOADS_DIR, "avatars")
QR_DIR = os.path.join(UPLOADS_DIR, "qr")

for d in [UPLOADS_DIR, CARDS_DIR, AVATARS_DIR, QR_DIR]:
    os.makedirs(d, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Maximum upload size: 10 MB
MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}

# --- Helper Functions ---

def sanitize_filename(name: str) -> str:
    """Sanitize name for use in HTTP Content-Disposition headers."""
    clean = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", name).strip("._-")
    return clean or "contact"

def sanitize_csv_cell(val: Any) -> str:
    """Neutralize spreadsheet formula injection characters (=, +, -, @, Tab, CR)."""
    if val is None:
        return ""
    s = str(val)
    if s.startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{s}"
    return s

# Allowed columns for scanned_cards updates
ALLOWED_CARD_FIELDS = {
    "full_name", "job_title", "company", "phone", "email",
    "website", "address", "notes", "tags", "image_url"
}

# --- Pydantic Models ---

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class CardCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: Optional[Any] = "Unnamed Contact"
    job_title: Optional[Any] = ""
    company: Optional[Any] = ""
    phone: Optional[Any] = ""
    email: Optional[Any] = ""
    website: Optional[Any] = ""
    address: Optional[Any] = ""
    notes: Optional[Any] = ""
    tags: Optional[Any] = ""
    raw_text: Optional[Any] = ""
    image_url: Optional[Any] = ""
    user_id: Optional[Any] = None
    force: Optional[Any] = False

class CardUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: Optional[Any] = None
    job_title: Optional[Any] = None
    company: Optional[Any] = None
    phone: Optional[Any] = None
    email: Optional[Any] = None
    website: Optional[Any] = None
    address: Optional[Any] = None
    notes: Optional[Any] = None
    tags: Optional[Any] = None
    image_url: Optional[Any] = None

class DigitalCardUpdateRequest(BaseModel):
    full_name: str
    job_title: Optional[str] = ""
    company: Optional[str] = ""
    headline: Optional[str] = ""
    bio: Optional[str] = ""
    theme: Optional[str] = "apple_dark"
    badge_text: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    address: Optional[str] = ""
    social_links: Optional[Dict[str, str]] = {}
    custom_buttons: Optional[List[Dict[str, Any]]] = []

# --- Endpoints ---

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "BusinessContact API", "version": "1.0.0"}

# --- User Authentication Endpoints ---

@app.post("/api/auth/register")
def register_user(req: UserRegisterRequest):
    email = req.email.strip().lower()
    full_name = req.full_name.strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email is required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    pwd_hash = hash_password(req.password)
    cursor.execute("""
    INSERT INTO users (email, password_hash, full_name)
    VALUES (?, ?, ?)
    """, (email, pwd_hash, full_name))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    token = create_access_token(user_id, email, full_name)
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name,
        }
    }

@app.post("/api/auth/login")
def login_user(req: UserLoginRequest):
    email = req.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, password_hash, full_name, avatar_url FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = user["id"]
    full_name = user["full_name"]
    token = create_access_token(user_id, email, full_name)
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "avatar_url": user["avatar_url"],
        }
    }

@app.get("/api/auth/me")
def get_current_user_profile(user: dict = Depends(get_current_user_required)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = ?", (user["user_id"],))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": dict(row)}

def save_file_to_disk(path: str, data: bytes):
    try:
        with open(path, "wb") as f:
            f.write(data)
    except Exception as e:
        print(f"Error saving image to disk: {e}")

# 1. OCR Scan Endpoint
@app.post("/api/scan")
async def scan_business_card(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Accepts an uploaded image file, processes in-memory through Gemini Vision AI,
    and writes to disk asynchronously for maximum speed.
    """
    # 1. Validate file extension
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )
    
    # 2. Read content in chunks to guard against DoS / memory exhaustion
    content = bytearray()
    chunk_size = 1024 * 1024  # 1MB chunk
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image file exceeds maximum allowed limit of {MAX_UPLOAD_SIZE // (1024*1024)} MB."
            )
            
    # 3. Validate image integrity using PIL
    try:
        img_check = Image.open(io.BytesIO(content))
        img_check.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid or readable image."
        )

    # 4. Generate unique filename and initiate async background disk write
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_path = os.path.join(CARDS_DIR, unique_filename)
    
    try:
        # Background task saves file to disk without blocking the AI call
        background_tasks.add_task(save_file_to_disk, saved_path, bytes(content))
            
        # 1. Primary: Extract with Google Gemini Multimodal Vision AI directly in-memory!
        ai_card = extract_card_with_gemini(bytes(content))
        if ai_card:
            ai_card["image_url"] = f"/uploads/cards/{unique_filename}"
            return {"success": True, "card": ai_card, "source": "gemini_ai"}

        # 2. Hybrid Fallback: Local Tesseract OCR (requires saved file)
        save_file_to_disk(saved_path, bytes(content))
        ocr_result = process_card_image(saved_path)
        if not ocr_result.get("success"):
            # Clean up saved file if OCR completely failed
            if os.path.exists(saved_path):
                os.remove(saved_path)
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": "Failed to read image", "error": ocr_result.get("error")}
            )
            
        data = ocr_result["data"]
        data["image_url"] = f"/uploads/cards/{unique_filename}"
        return {"success": True, "card": data, "source": "tesseract_ocr"}
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect-card")
async def detect_card_presence(file: UploadFile = File(...)):
    """
    High-accuracy real-time computer vision card presence detector.
    Works like a QR code scanner for business cards:
    - Instantly rejects black screens, covered cameras, blank/flat desks, and darkness.
    - Requires genuine card characteristics (text lines, aspect ratio, or alphanumeric words).
    - Returns has_card: True ONLY when a real business card is aligned in frame.
    """
    try:
        content = await file.read()
        if not content:
            return {"has_card": False, "reason": "empty"}

        import cv2
        import numpy as np

        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"has_card": False, "reason": "invalid_image"}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # 1. Reject dark/black screens, covered lenses, or very low light
        if mean_val < 30 or (mean_val < 45 and std_val < 15):
            return {
                "has_card": False,
                "reason": "black_or_covered_screen",
                "message": "Camera covered or too dark"
            }

        # 2. Reject blank flat surfaces (empty desks, blank paper, plain floors/walls)
        if laplacian_var < 15 or std_val < 10:
            return {
                "has_card": False,
                "reason": "blank_surface",
                "message": "No business card detected"
            }

        # Standardize height for consistent morphological analysis (< 3ms)
        h, w = gray.shape[:2]
        target_h = 400
        scale = target_h / float(h)
        resized = cv2.resize(gray, (int(w * scale), target_h))
        total_area = resized.shape[0] * resized.shape[1]

        # 3. Detect horizontal text line structures (name, phone, company, email)
        grad_x = cv2.Sobel(resized, cv2.CV_32F, 1, 0, ksize=3)
        grad_x = cv2.convertScaleAbs(grad_x)
        _, thresh = cv2.threshold(grad_x, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 4))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        text_lines = 0
        for c in contours:
            x, y, cw, ch = cv2.boundingRect(c)
            aspect = float(cw) / max(1, ch)
            area = cw * ch
            # Text lines are wider than tall and occupy reasonable proportions
            if aspect >= 1.5 and ch >= 5 and cw >= 15 and (area / total_area) < 0.4:
                text_lines += 1

        # 4. Detect card bounding rectangle (approxPolyDP == 4 corners)
        blurred = cv2.GaussianBlur(resized, (5, 5), 0)
        edges = cv2.Canny(blurred, 40, 120)
        b_contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        has_card_contour = False
        for cnt in b_contours:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            area = cv2.contourArea(cnt)
            if len(approx) == 4 and (area / total_area) > 0.08:
                has_card_contour = True
                break

        # Fast match: Multiple text lines or card contour with text
        if text_lines >= 2 or (has_card_contour and text_lines >= 1):
            return {
                "has_card": True,
                "reason": "card_detected",
                "message": "Business card detected"
            }

        # 5. Fast OCR verification fallback for clean cards
        try:
            from PIL import Image
            import pytesseract
            from app.ocr_service import configure_tesseract
            configure_tesseract()
            pil_img = Image.fromarray(resized)
            txt = pytesseract.image_to_string(pil_img, config="--oem 3 --psm 11")
            words = [w for w in re.split(r"\s+", txt) if len(w) >= 3]
            if len(words) >= 2:
                return {
                    "has_card": True,
                    "reason": "card_detected",
                    "message": "Business card detected"
                }
        except Exception:
            pass

        return {
            "has_card": False,
            "reason": "no_card_detected",
            "message": "No business card in frame"
        }
    except Exception as e:
        return {"has_card": False, "error": str(e)}

# 2. Scanned Cards CRUD
@app.get("/api/cards")
def list_cards(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM scanned_cards WHERE 1=1"
    params = []
    
    # User scoping: if authenticated, filter by user's cards (or legacy user_id=1 for demo items)
    if current_user:
        query += " AND (user_id = ? OR user_id = 1)"
        params.append(current_user["user_id"])
        
    if search:
        search_param = f"%{search.strip()}%"
        query += " AND (full_name LIKE ? OR company LIKE ? OR email LIKE ? OR job_title LIKE ?)"
        params.extend([search_param, search_param, search_param, search_param])
        
    if tag:
        tag_param = f"%{tag.strip()}%"
        query += " AND tags LIKE ?"
        params.append(tag_param)
        
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cards = [dict(row) for row in rows]
    conn.close()
    return {"cards": cards, "total": len(cards)}

def to_clean_str(val: Any, default: str = "") -> str:
    """Safely convert any value (None, list, int, etc.) to a clean string."""
    if val is None:
        return default
    if isinstance(val, (list, tuple)):
        return ", ".join(str(v).strip() for v in val if v)
    return str(val).strip()

@app.post("/api/cards")
def create_card(
    card: CardCreateRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    # Safely resolve user_id even if card.user_id is None, empty string, or non-numeric
    raw_uid = current_user["user_id"] if current_user else card.user_id
    try:
        user_id = int(raw_uid) if raw_uid is not None and str(raw_uid).strip().isdigit() else 1
    except (ValueError, TypeError):
        user_id = 1

    card_name = to_clean_str(card.full_name) or "Unnamed Contact"
    job_title = to_clean_str(card.job_title)
    company = to_clean_str(card.company)
    phone = to_clean_str(card.phone)
    email = to_clean_str(card.email)
    website = to_clean_str(card.website)
    address = to_clean_str(card.address)
    notes = to_clean_str(card.notes)
    tags = to_clean_str(card.tags)
    raw_text = to_clean_str(card.raw_text)
    image_url = to_clean_str(card.image_url)

    is_force = bool(card.force) if card.force not in ("false", "False", "0", 0, None, False) else False

    conn = get_db_connection()
    cursor = conn.cursor()

    # Duplicate check: check if this business card already exists in this user's vault
    if not is_force:
        clean_email = email.lower()
        clean_phone = re.sub(r"[^\d+]", "", phone)
        clean_name = card_name.lower()
        clean_company = company.lower()

        existing = None
        # 1. Match by Email if present
        if clean_email:
            cursor.execute("""
            SELECT * FROM scanned_cards 
            WHERE user_id = ? AND LOWER(TRIM(email)) = ?
            LIMIT 1
            """, (user_id, clean_email))
            existing = cursor.fetchone()

        # 2. Match by Phone suffix if present
        if not existing and len(clean_phone) >= 7:
            phone_suffix = clean_phone[-8:]
            cursor.execute("""
            SELECT * FROM scanned_cards
            WHERE user_id = ? AND phone LIKE ?
            LIMIT 1
            """, (user_id, f"%{phone_suffix}%"))
            existing = cursor.fetchone()

        # 3. Match by Name + Company if both are meaningful
        if not existing and clean_name != "unnamed contact" and clean_company:
            cursor.execute("""
            SELECT * FROM scanned_cards
            WHERE user_id = ? AND LOWER(TRIM(full_name)) = ? AND LOWER(TRIM(company)) = ?
            LIMIT 1
            """, (user_id, clean_name, clean_company))
            existing = cursor.fetchone()

        if existing:
            existing_dict = dict(existing)
            conn.close()
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "already_exists": True,
                    "message": f"'{existing_dict.get('full_name')}' from '{existing_dict.get('company') or 'this company'}' already exists in your Cards Vault.",
                    "existing_card": existing_dict,
                }
            )

    cursor.execute("""
    INSERT INTO scanned_cards (
        user_id, full_name, job_title, company, phone, email, website,
        address, notes, tags, raw_text, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, card_name, job_title, company, phone,
        email, website, address, notes,
        tags, raw_text, image_url
    ))
    conn.commit()
    card_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM scanned_cards WHERE id = ?", (card_id,))
    new_card = dict(cursor.fetchone())
    conn.close()
    return {"success": True, "card": new_card}

@app.get("/api/cards/{card_id}")
def get_card(card_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scanned_cards WHERE id = ?", (card_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"card": dict(row)}

@app.put("/api/cards/{card_id}")
def update_card(card_id: int, card: CardUpdateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM scanned_cards WHERE id = ?", (card_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Card not found")
        
    # Whitelist allowed fields to prevent any SQL injection or column tampering
    update_data = {
        k: v for k, v in card.model_dump().items()
        if v is not None and k in ALLOWED_CARD_FIELDS
    }
    
    if update_data:
        fields = ", ".join([f"{k} = ?" for k in update_data.keys()])
        values = list(update_data.values())
        values.append(card_id)
        cursor.execute(f"UPDATE scanned_cards SET {fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", values)
        conn.commit()
        
    cursor.execute("SELECT * FROM scanned_cards WHERE id = ?", (card_id,))
    updated_card = dict(cursor.fetchone())
    conn.close()
    return {"success": True, "card": updated_card}

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT image_url FROM scanned_cards WHERE id = ?", (card_id,))
    existing = cursor.fetchone()
    if existing and existing["image_url"]:
        img_path = existing["image_url"].replace("/uploads/", "")
        disk_path = os.path.join(UPLOADS_DIR, img_path)
        if os.path.exists(disk_path):
            try:
                os.remove(disk_path)
            except OSError:
                pass

    cursor.execute("DELETE FROM scanned_cards WHERE id = ?", (card_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Card deleted successfully"}

class FollowUpRequest(BaseModel):
    context: Optional[str] = ""

@app.post("/api/cards/{card_id}/followup")
def generate_card_followup(card_id: int, req: Optional[FollowUpRequest] = None):
    """
    Generates a personalized AI networking follow-up message for a scanned contact.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scanned_cards WHERE id = ?", (card_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")

    card_data = dict(row)
    context_text = req.context if req else ""
    message = generate_followup_message(card_data, context_text)
    if not message:
        # Fallback template if Gemini key not set
        name = card_data.get("full_name") or "there"
        company = card_data.get("company") or ""
        subject = f"Following up from our conversation - {name}"
        body = f"Hi {name},\n\nIt was great connecting with you{' from ' + company if company else ''}. I'd love to stay in touch and explore ways we can collaborate.\n\nBest regards,\n[Your Name]"
        return {"success": True, "subject": subject, "body": body, "source": "template"}

    return {"success": True, "message": message, "source": "gemini_ai"}

# 3. vCard and Export Endpoints
@app.get("/api/cards/{card_id}/vcard")
def download_card_vcard(card_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scanned_cards WHERE id = ?", (card_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
        
    card_dict = dict(row)
    vcard_str = generate_vcard_content(card_dict)
    safe_name = sanitize_filename(card_dict.get("full_name") or "contact")
    
    return Response(
        content=vcard_str,
        media_type="text/vcard",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.vcf"'}
    )

@app.get("/api/vcard/quick")
def quick_vcard_download(
    full_name: Optional[str] = "Business Contact",
    job_title: Optional[str] = "",
    company: Optional[str] = "",
    phone: Optional[str] = "",
    email: Optional[str] = "",
    website: Optional[str] = "",
    address: Optional[str] = "",
    notes: Optional[str] = ""
):
    """
    On-the-fly vCard 3.0 generation for iOS Safari & Android.
    Opening this endpoint directly triggers Apple iOS Contacts sheet to 'Add to Contacts'.
    """
    card_dict = {
        "full_name": full_name or "Business Contact",
        "job_title": job_title or "",
        "company": company or "",
        "phone": phone or "",
        "email": email or "",
        "website": website or "",
        "address": address or "",
        "notes": notes or ""
    }
    vcard_str = generate_vcard_content(card_dict)
    safe_name = sanitize_filename(full_name or "contact")
    return Response(
        content=vcard_str,
        media_type="text/vcard; charset=utf-8",
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}.vcf"',
            "Content-Type": "text/vcard; charset=utf-8"
        }
    )

@app.get("/api/cards/export/csv")
def export_cards_csv():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scanned_cards ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Full Name", "Job Title", "Company", "Phone",
        "Email", "Website", "Address", "Notes", "Tags", "Created At"
    ])
    
    for r in rows:
        writer.writerow([
            sanitize_csv_cell(r["id"]),
            sanitize_csv_cell(r["full_name"]),
            sanitize_csv_cell(r["job_title"]),
            sanitize_csv_cell(r["company"]),
            sanitize_csv_cell(r["phone"]),
            sanitize_csv_cell(r["email"]),
            sanitize_csv_cell(r["website"]),
            sanitize_csv_cell(r["address"]),
            sanitize_csv_cell(r["notes"]),
            sanitize_csv_cell(r["tags"]),
            sanitize_csv_cell(r["created_at"]),
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="contacts_export.csv"'}
    )

# 4. Digital Business Card Profile
@app.get("/api/digital-card")
def get_user_digital_card():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM digital_cards LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Digital card not configured")
        
    data = dict(row)
    data["social_links"] = json.loads(data["social_links"]) if data.get("social_links") else {}
    data["custom_buttons"] = json.loads(data["custom_buttons"]) if data.get("custom_buttons") else []
    return {"card": data}

@app.put("/api/digital-card")
def update_user_digital_card(card: DigitalCardUpdateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, slug FROM digital_cards LIMIT 1")
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Digital card not found")
        
    card_id = row["id"]
    cursor.execute("""
    UPDATE digital_cards SET
        full_name = ?, job_title = ?, company = ?, headline = ?,
        bio = ?, theme = ?, badge_text = ?, phone = ?, email = ?,
        website = ?, address = ?, social_links = ?, custom_buttons = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (
        card.full_name, card.job_title, card.company, card.headline,
        card.bio, card.theme, card.badge_text, card.phone, card.email,
        card.website, card.address, json.dumps(card.social_links or {}),
        json.dumps(card.custom_buttons or []), card_id
    ))
    conn.commit()
    
    cursor.execute("SELECT * FROM digital_cards WHERE id = ?", (card_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    
    updated["social_links"] = json.loads(updated["social_links"]) if updated.get("social_links") else {}
    updated["custom_buttons"] = json.loads(updated["custom_buttons"]) if updated.get("custom_buttons") else []
    return {"success": True, "card": updated}

@app.get("/api/digital-card/qr")
def get_digital_card_qr(slug: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if slug:
        cursor.execute("SELECT slug FROM digital_cards WHERE slug = ?", (slug,))
    else:
        cursor.execute("SELECT slug FROM digital_cards LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
        
    target_slug = row["slug"]
    public_url = f"http://localhost:5173/c/{target_slug}"
    qr_data_uri = generate_qr_code_image(public_url)
    return {"slug": target_slug, "url": public_url, "qr_data_uri": qr_data_uri}

# 5. Public Card View (when a contact scans your QR code)
@app.get("/api/c/{slug}")
def get_public_card(slug: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM digital_cards WHERE slug = ?", (slug,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Digital card not found")
        
    data = dict(row)
    data["social_links"] = json.loads(data["social_links"]) if data.get("social_links") else {}
    data["custom_buttons"] = json.loads(data["custom_buttons"]) if data.get("custom_buttons") else []
    return {"card": data}

@app.get("/api/c/{slug}/vcard")
def download_public_card_vcard(slug: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM digital_cards WHERE slug = ?", (slug,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Digital card not found")
        
    card_dict = dict(row)
    vcard_str = generate_vcard_content(card_dict)
    safe_name = sanitize_filename(card_dict.get("full_name") or "contact")
    
    return Response(
        content=vcard_str,
        media_type="text/vcard",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.vcf"'}
    )
