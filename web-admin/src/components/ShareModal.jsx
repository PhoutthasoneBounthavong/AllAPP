import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Share2,
  Copy,
  Check,
  Download,
  Smartphone,
  ExternalLink,
  Wifi,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ShareModal({ card }) {
  const [copied, setCopied] = useState(false);
  const slug = card?.slug || "alex-morgan";
  const publicUrl = `${window.location.origin}/c/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.8 },
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${slug}_qr_code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center max-w-lg mx-auto mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center justify-center gap-2">
          <span>Share Your Digital Card</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0071E3]/20 dark:text-[#409CFF]">
            Cardr Instant Connect
          </span>
        </h1>
        <p className="text-xs text-[#86868B] mt-1">
          Anyone can scan this QR code with their iPhone or Android camera to instantly view your profile and save your contact card.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-3xl mx-auto">
        {/* QR Code Card */}
        <div className="apple-glass rounded-apple-2xl p-8 border border-black/[0.08] dark:border-white/[0.1] shadow-apple-lg flex flex-col items-center text-center">
          {/* Subtle NFC Wave Header */}
          <div className="flex items-center gap-2 text-xs text-[#86868B] mb-5">
            <Wifi className="w-4 h-4 text-[#0071E3]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase">Tap & Scan Ready</span>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-apple-xl shadow-md border border-black/5 mb-6">
            <QRCodeSVG
              id="qr-code-svg"
              value={publicUrl}
              size={220}
              level="M"
              includeMargin={false}
              fgColor="#1C1C1E"
              bgColor="#FFFFFF"
            />
          </div>

          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">{card?.full_name}</h3>
          <p className="text-xs text-[#86868B] mt-0.5">{card?.job_title} • {card?.company}</p>

          {/* Download QR Button */}
          <button
            onClick={handleDownloadQr}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-apple-md bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.03] transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Download High-Res QR (PNG)</span>
          </button>
        </div>

        {/* Share Channels & Link Copy */}
        <div className="space-y-5">
          {/* Public Link Box */}
          <div className="apple-glass rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] block mb-2">
              Public Profile URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-mono text-[#1D1D1F] dark:text-white truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-apple-sm bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#0071E3] hover:underline font-medium"
              >
                <span>Preview Public Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Share Instructions */}
          <div className="apple-glass rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#0071E3]" />
              How Others Save Your Contact
            </h4>
            <ol className="text-xs text-[#86868B] space-y-2 list-decimal list-inside leading-relaxed">
              <li>Open the standard Camera app on an iPhone or Android phone.</li>
              <li>Point the lens at your QR code on screen or business card.</li>
              <li>Tap the pop-up banner to open your card profile.</li>
              <li>Tap <strong>"Save to Apple / Android Contacts"</strong> to download your verified vCard.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
