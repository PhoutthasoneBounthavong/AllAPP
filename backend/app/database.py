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
    
    # 1. Users Table for Multi-user Account Support
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Seed default user if none exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Import auth_service hash function
        from app.auth_service import hash_password
        default_pwd = hash_password("demo1234")
        cursor.execute("""
        INSERT INTO users (email, password_hash, full_name)
        VALUES (?, ?, ?)
        """, ("demo@cardr.app", default_pwd, "Demo User"))
    
    # 2. Scanned Business Cards
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scanned_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
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
    
    # Check if user_id column exists on scanned_cards (migration)
    cursor.execute("PRAGMA table_info(scanned_cards)")
    columns = [row["name"] for row in cursor.fetchall()]
    if "user_id" not in columns:
        cursor.execute("ALTER TABLE scanned_cards ADD COLUMN user_id INTEGER DEFAULT 1")
    
    # 3. Digital Business Cards (Shareable profile like Cardr)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS digital_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
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
    
    # Check if user_id column exists on digital_cards (migration)
    cursor.execute("PRAGMA table_info(digital_cards)")
    columns = [row["name"] for row in cursor.fetchall()]
    if "user_id" not in columns:
        cursor.execute("ALTER TABLE digital_cards ADD COLUMN user_id INTEGER DEFAULT 1")
    
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
            user_id, slug, full_name, job_title, company, headline, bio, theme,
            phone, email, website, address, social_links, custom_buttons
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1,
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
