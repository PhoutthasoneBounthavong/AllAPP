import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Camera,
  Scan,
  CheckCircle2,
  AlertCircle,
  Save,
  Download,
  Building,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { scanCardImage, createCard, getImageUrl } from "../api";

export default function QuickScanner({ onCardSaved }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setScanResult(null);
      setSavedSuccess(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      setScanResult(null);
      setSavedSuccess(false);
    }
  };

  const startCamera = async () => {
    try {
      setUseCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Unable to access camera: " + err.message);
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setUseCamera(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
      setFile(capturedFile);
      setPreviewUrl(URL.createObjectURL(capturedFile));
      stopCamera();
    }, "image/jpeg", 0.95);
  };

  const runOcrScan = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const res = await scanCardImage(file);
      setScanResult(res.card);
      setScanning(false);
    } catch (err) {
      alert("OCR scanning failed: " + err.message);
      setScanning(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setScanResult((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveToVault = async () => {
    if (!scanResult) return;
    setSaving(true);
    try {
      const payload = {
        full_name: scanResult.full_name || "New Contact",
        job_title: scanResult.job_title || "",
        company: scanResult.company || "",
        phone: scanResult.phone || "",
        email: scanResult.email || "",
        website: scanResult.website || "",
        address: scanResult.address || "",
        notes: "Scanned via Cardr Studio OCR",
        tags: "Scanned",
        raw_text: scanResult.raw_text || "",
        image_url: scanResult.image_url || "",
      };
      await createCard(payload);
      setSaving(false);
      setSavedSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
      });
      if (onCardSaved) onCardSaved();
    } catch (err) {
      alert("Error saving contact: " + err.message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
          <span>Quick Business Card Scanner</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            100% Free Local OCR
          </span>
        </h1>
        <p className="text-sm text-[#86868B] mt-1">
          Drop or take a photo of any physical card. Our AI-heuristic engine automatically categorizes Name, Title, Company, Phone, Email, and Location.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Scanner / Image Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="apple-glass rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-[#0071E3]" />
                Card Image Capture
              </span>

              <div className="flex items-center gap-2">
                {!useCamera ? (
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/10 text-xs font-medium text-[#1D1D1F] dark:text-white transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 rounded-apple-sm bg-rose-500/10 text-rose-500 text-xs font-medium"
                  >
                    Cancel Camera
                  </button>
                )}
              </div>
            </div>

            {/* Camera Viewfinder */}
            {useCamera ? (
              <div className="relative rounded-apple-lg overflow-hidden bg-black aspect-[16/10] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {/* Viewfinder Target Frame */}
                <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-apple-md pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] bg-black/60 px-3 py-1 rounded-full text-white/90">
                    Align business card inside frame
                  </span>
                </div>
                {/* Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center">
                  <button
                    onClick={captureCameraFrame}
                    className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-white/30 backdrop-blur-md active:scale-90 transition-transform shadow-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-white" />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Upload Area */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-apple-lg border-2 border-dashed p-6 text-center cursor-pointer transition-all aspect-[16/10] flex flex-col items-center justify-center overflow-hidden ${
                  previewUrl
                    ? "border-transparent bg-black/5 dark:bg-white/5"
                    : "border-black/[0.1] dark:border-white/[0.1] hover:border-[#0071E3]/50 bg-white/40 dark:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-apple-sm" />
                    {/* Laser Scanning Animation Beam */}
                    {scanning && (
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#0071E3] to-transparent shadow-[0_0_15px_#0071E3] animate-pulse top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0071E3] flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                      Click to upload or drag & drop card
                    </p>
                    <p className="text-[11px] text-[#86868B] mt-1">PNG, JPG, HEIC up to 15MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Scan Action Button */}
            {previewUrl && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={runOcrScan}
                  disabled={scanning}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-apple-md bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{scanning ? "Reading card with OCR..." : "Analyze & Extract Fields"}</span>
                </button>

                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setScanResult(null);
                  }}
                  className="p-2.5 rounded-apple-md border border-black/10 dark:border-white/10 hover:bg-black/5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  title="Clear"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recognized Fields & Verification (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="apple-glass rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08] mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <span>Contact Field Extraction</span>
                  {scanResult && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      High Confidence
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Verify or edit recognized contact attributes before saving to your vault or phone address book.
                </p>
              </div>

              {scanResult && (
                <button
                  onClick={handleSaveToVault}
                  disabled={saving || savedSuccess}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-apple-md bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Contact</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Fields Form */}
            {scanResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0071E3]" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={scanResult.full_name}
                      onChange={(e) => handleFieldChange("full_name", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#0071E3]" />
                      Company
                    </label>
                    <input
                      type="text"
                      value={scanResult.company}
                      onChange={(e) => handleFieldChange("company", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#0071E3]" />
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={scanResult.job_title}
                      onChange={(e) => handleFieldChange("job_title", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={scanResult.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={scanResult.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-500" />
                      Website
                    </label>
                    <input
                      type="text"
                      value={scanResult.website}
                      onChange={(e) => handleFieldChange("website", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={scanResult.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>

                {/* Raw OCR Text Drawer */}
                <div className="pt-2">
                  <details className="text-xs text-[#86868B] cursor-pointer">
                    <summary className="font-medium hover:text-[#1D1D1F] dark:hover:text-white">
                      View Raw OCR Extracted Text
                    </summary>
                    <pre className="mt-2 p-3 bg-black/5 dark:bg-white/5 rounded-apple-sm text-[11px] font-mono whitespace-pre-wrap overflow-x-auto text-[#1D1D1F] dark:text-white">
                      {scanResult.raw_text}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-[#86868B]">
                <Scan className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-xs">No card scanned yet.</p>
                <p className="text-[11px] mt-0.5">Upload a business card on the left to extract contact information.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
