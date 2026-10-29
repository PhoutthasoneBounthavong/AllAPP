import sqlite3
import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "business_contact.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Scanned Business Cards
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scanned_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        job_title TEXT,
        company TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        notes TEXT,
        tags TEXT,
        raw_text TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Digital Business Cards (Shareable profile like Cardr)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS digital_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        job_title TEXT,
        company TEXT,
        headline TEXT,
        bio TEXT,
        theme TEXT DEFAULT 'apple_dark',
        avatar_url TEXT,
        banner_url TEXT,
        badge_text TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        social_links TEXT,
        custom_buttons TEXT,
        qr_code_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Seed default digital card if none exists
    cursor.execute("SELECT COUNT(*) FROM digital_cards")
    if cursor.fetchone()[0] == 0:
        default_socials = json.dumps({
            "linkedin": "https://linkedin.com",
            "twitter": "https://x.com",
            "github": "https://github.com",
            "whatsapp": ""
        })
        default_buttons = json.dumps([
            {"label": "Schedule a Call", "url": "https://calendly.com", "icon": "calendar"},
            {"label": "Portfolio", "url": "https://apple.com", "icon": "briefcase"}
        ])
        cursor.execute("""
        INSERT INTO digital_cards (
            slug, full_name, job_title, company, headline, bio, theme,
            phone, email, website, address, social_links, custom_buttons
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "alex-morgan",
            "Alex Morgan",
            "Chief Executive Officer & Founder",
            "Aura Technologies Inc.",
            "Designing next-generation spatial computing & AI systems.",
            "Building elegant software at the intersection of design, engineering, and human experience.",
            "apple_dark",
            "+1 (555) 234-5678",
            "alex.morgan@auratech.io",
            "https://auratech.io",
            "1 Infinite Loop, Cupertino, CA 95014",
            default_socials,
            default_buttons
        ))
        
    conn.commit()
    conn.close()

# Initialize upon module import
init_db()
