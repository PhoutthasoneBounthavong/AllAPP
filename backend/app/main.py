import os
import json
import csv
import io
import uuid
import re
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from PIL import Image

from app.database import get_db_connection, init_db
from app.ocr_service import process_card_image
from app.vcard_service import generate_vcard_content
from app.qr_service import generate_qr_code_image

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

class CardCreateRequest(BaseModel):
    full_name: str
    job_title: Optional[str] = ""
    company: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    address: Optional[str] = ""
    notes: Optional[str] = ""
    tags: Optional[str] = ""
    raw_text: Optional[str] = ""
    image_url: Optional[str] = ""

class CardUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    image_url: Optional[str] = None

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

# 1. OCR Scan Endpoint
@app.post("/api/scan")
async def scan_business_card(file: UploadFile = File(...)):
    """
    Accepts an uploaded image file, validates size and format,
    processes through OCR, and returns parsed contact details.
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

    # 4. Save securely with UUID filename
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_path = os.path.join(CARDS_DIR, unique_filename)
    
    try:
        with open(saved_path, "wb") as f:
            f.write(content)
            
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
        return {"success": True, "card": data}
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail=str(e))

# 2. Scanned Cards CRUD
@app.get("/api/cards")
def list_cards(search: Optional[str] = None, tag: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM scanned_cards WHERE 1=1"
    params = []
    
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

@app.post("/api/cards")
def create_card(card: CardCreateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO scanned_cards (
        full_name, job_title, company, phone, email, website,
        address, notes, tags, raw_text, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        card.full_name, card.job_title, card.company, card.phone,
        card.email, card.website, card.address, card.notes,
        card.tags, card.raw_text, card.image_url
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
