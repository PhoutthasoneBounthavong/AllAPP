# 📇 Cardr — Apple-Grade Business Card Scanner & Digital Card Platform

> Inspired by [Cardr.app](https://cardr.app/), built with **Apple Human Interface Guidelines (HIG)** aesthetics, free local OCR, and automatic contact entity classification.

---

## 🌟 Key Features

### 1. 🔍 Free Local OCR & Smart Entity Categorization
- **100% Free & Offline-Ready**: Powered by high-speed Tesseract OCR + Leptonica preprocessing with **zero paid API fees**.
- **Intelligent Field Parsing**:
  - 👤 **Full Name** (Position, linguistic cues, title filtering)
  - 💼 **Job Title & Company** (200+ executive & corporate roles taxonomy, legal suffix matching)
  - 📞 **Phone & Mobile Numbers** (International & domestic format normalization)
  - ✉️ **Email Address** (RFC regex extraction)
  - 🌐 **Website & Domain** (Automatic https:// normalization)
  - 📍 **Physical Address** (Street, suite, building, city, state, and ZIP detection)
- **Field Confidence Scoring**: Evaluates and rates extraction certainty (`high`, `medium`, `low`).

### 2. 🎨 Card Studio — Apple HIG Digital Card Customizer
- **Cupertino Themes**: Apple Slate (Titanium dark mode), Ceramic Pearl White, Midnight Sapphire, Emerald Luxury, and Cupertino Aurora.
- **Realistic 3D Card Tilt**: Dynamic perspective sheen and lighting reflection.
- **Live iPhone 16 Pro Simulator**: Instant side-by-side preview as you edit your identity, headline, social handles, and custom buttons.
- **One-Tap Save to Native Contacts**: Automatically generates RFC 6350 / vCard 3.0 (`.vcf`) compatible with Apple iOS Contacts, Google Contacts, and Outlook.
- **Dynamic Apple-Style QR Code**: Rounded modules with high error correction and instant PNG download.

### 3. 📂 Cards Vault (Contact Management)
- Grid & Table views of all digitized business cards.
- Instant search by name, company, role, email, or phone.
- Export all contacts to **CSV (Excel/CRM)**.
- Download individual **vCard (`.vcf`)** files.

### 4. 📱 Client Mobile App (React Native / Expo)
- **Apple Camera HUD**: Viewfinder with glowing corner brackets, torch toggle, and shutter button.
- **Auto-Analyze**: Point camera at any card to extract fields instantly.
- **Save to Phone Contacts**: Uses native `expo-contacts` to write directly to the device's address book.
- **My Digital Card & QR**: Fullscreen card display for instant conference networking.

---

## 🏛️ Project Architecture

```
BusinessContact/
├── backend/                  # Python FastAPI REST API & Free OCR Engine
│   ├── app/
│   │   ├── database.py       # SQLite database (cards, digital profiles)
│   │   ├── ocr_service.py    # Tesseract OCR & image contrast enhancement
│   │   ├── parser_service.py # Smart entity classification engine
│   │   ├── vcard_service.py  # RFC 6350 / vCard 3.0 (.vcf) generator
│   │   ├── qr_service.py     # Rounded Apple-style QR code generator
│   │   └── main.py           # FastAPI endpoints & CORS
│   └── tests/
│       ├── test_parser.py    # Unit tests for field parser
│       └── test_ocr.py       # End-to-end OCR test on synthetic card
│
├── web-admin/                # Web Admin Studio & Card Designer (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.jsx         # Apple frosted glass navigation bar
│   │   │   ├── DigitalCardPreview.jsx # 3D tiltable digital business card
│   │   │   ├── CardDesigner.jsx       # Studio designer with iPhone 16 Pro simulator
│   │   │   ├── CardsVault.jsx         # Searchable contact management vault
│   │   │   ├── QuickScanner.jsx       # Drag-and-drop & webcam card scanner
│   │   │   ├── ShareModal.jsx         # Apple-rounded QR code display & download
│   │   │   ├── PublicCardView.jsx     # Public landing page (/c/:slug)
│   │   │   └── SocialIcons.jsx        # Clean SVG social media icons
│   │   ├── api.js                     # Backend API client
│   │   └── index.css                  # Apple HIG typography, vibrancy, and shadows
│   └── package.json
│
├── mobile-app/               # Client Mobile Application (React Native / Expo)
│   ├── src/
│   │   ├── screens/          # Scanner, Cards Vault, My Digital Card
│   │   └── services/         # Native Phone Contacts API integration
│   └── package.json
│
├── start-all.bat             # 1-Click launcher for Backend + Web Admin
├── start-backend.bat         # Start Backend FastAPI on port 8000
├── start-web.bat             # Start Web Admin on port 5173
└── start-mobile.bat          # Start Expo Mobile dev server
```

---

## 🚀 Quick Start Guide

### Step 1: Launch Backend API & Web Admin
Double-click `start-all.bat` (or run in terminal):
```powershell
.\start-all.bat
```
- **Web Admin Studio**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 2: Launch Mobile Client App
Double-click `start-mobile.bat` (or run in terminal):
```powershell
.\start-mobile.bat
```
- Scan the terminal QR code with **Expo Go** (available on the iOS App Store & Google Play) to run the app directly on your physical iPhone or Android phone!
- Or press `w` to run the mobile app in your web browser.

---

## 🧪 Testing the Scanner & OCR Engine

You can run the automated tests at any time:
```powershell
cd backend
.\venv\Scripts\python tests/test_parser.py
.\venv\Scripts\python tests/test_ocr.py
```
Both test suites will verify entity parsing precision and direct OCR recognition on synthetic cards!

---

## 📄 License
MIT License — free to use and customize.
