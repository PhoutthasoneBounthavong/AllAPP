import React, { useState } from "react";
import {
  Phone,
  Mail,

  Globe,
  MapPin,
  MessageCircle,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { LinkedinIcon, TwitterIcon, GithubIcon } from "./SocialIcons";
import { getPublicCardVcardUrl } from "../api";

function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) {
    return "#";
  }
  if (!/^(https?|mailto|tel):/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}


export default function DigitalCardPreview({ card, isInteractive = true, onShare }) {
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const themeStyles = {
    apple_dark: {
      cardBg: "bg-gradient-to-br from-[#1C1C1E] via-[#121214] to-[#0A0A0C] text-white border-white/10 shadow-2xl",
      accent: "text-[#409CFF] bg-[#0071E3]/20 border-[#0071E3]/30",
      buttonBg: "bg-white/10 hover:bg-white/15 text-white border-white/10",
      chipBg: "bg-white/5 border-white/10 text-white/90",
      badge: "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30",
    },
    apple_light: {
      cardBg: "bg-gradient-to-br from-[#FFFFFF] via-[#F8F9FA] to-[#EFF2F5] text-[#1D1D1F] border-black/[0.08] shadow-apple-lg",
      accent: "text-[#0071E3] bg-[#0071E3]/10 border-[#0071E3]/20",
      buttonBg: "bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] border-black/[0.06]",
      chipBg: "bg-black/[0.03] border-black/[0.05] text-[#1D1D1F]",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    midnight: {
      cardBg: "bg-gradient-to-br from-[#0B1528] via-[#0F1E3D] to-[#050B14] text-white border-blue-500/20 shadow-2xl",
      accent: "text-cyan-400 bg-cyan-500/20 border-cyan-400/30",
      buttonBg: "bg-blue-500/10 hover:bg-blue-500/20 text-white border-blue-400/20",
      chipBg: "bg-blue-900/30 border-blue-500/20 text-blue-100",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    },
    emerald: {
      cardBg: "bg-gradient-to-br from-[#0A2619] via-[#061A11] to-[#020B07] text-white border-emerald-500/20 shadow-2xl",
      accent: "text-emerald-400 bg-emerald-500/20 border-emerald-400/30",
      buttonBg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-white border-emerald-400/20",
      chipBg: "bg-emerald-950/40 border-emerald-500/20 text-emerald-100",
      badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    },
    aurora: {
      cardBg: "bg-gradient-to-br from-[#2D124D] via-[#1E0D36] to-[#0C0517] text-white border-fuchsia-500/20 shadow-2xl",
      accent: "text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-400/30",
      buttonBg: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-white border-fuchsia-400/20",
      chipBg: "bg-purple-950/40 border-fuchsia-500/20 text-purple-100",
      badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30",
    },
  };

  const currentTheme = themeStyles[card?.theme] || themeStyles.apple_dark;

  const handleMouseMove = (e) => {
    if (!isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const socials = card?.social_links || {};
  const buttons = card?.custom_buttons || [];

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className={`relative w-full max-w-sm rounded-apple-2xl p-6 border transition-all duration-300 ${currentTheme.cardBg}`}
    >
      {/* Glossy Metallic Light Sheen */}
      <div className="absolute inset-0 rounded-apple-2xl bg-gradient-to-tr from-white/0 via-white/[0.04] to-white/0 pointer-events-none" />

      {/* Top Bar: Badge & NFC / Chip Indicator */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {card?.badge_text ? (
            <span className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${currentTheme.badge}`}>
              {card.badge_text}
            </span>
          ) : (
            <span className={`text-[11px] font-medium tracking-wide flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${currentTheme.badge}`}>
              <Sparkles className="w-3 h-3" />
              Verified Contact
            </span>
          )}
        </div>

        {/* Subtle NFC/Wireless Wave Icon */}
        <div className="flex items-center gap-1.5 opacity-60 text-xs">
          <span className="text-[10px] uppercase font-mono tracking-wider">TAP / SCAN</span>
          <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full border border-current" />
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-start gap-4 mb-5">
        {/* Avatar with subtle glow */}
        <div className="relative">
          <div className="w-18 h-18 rounded-apple-lg overflow-hidden border-2 border-white/20 shadow-md bg-white/10 flex items-center justify-center text-2xl font-semibold">
            {card?.avatar_url ? (
              <img src={card.avatar_url} alt={card?.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/80">
                {(card?.full_name || "A")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#1C1C1E] flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Name & Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate leading-tight">
            {card?.full_name || "Business Card"}
          </h2>
          <p className="text-xs font-medium text-white/70 dark:text-white/70 truncate mt-0.5">
            {card?.job_title || "Chief Executive Officer"}
          </p>
          <p className="text-xs font-semibold text-[#0071E3] dark:text-[#409CFF] truncate mt-0.5">
            {card?.company || "Aura Technologies Inc."}
          </p>
        </div>
      </div>

      {/* Headline / Bio */}
      {card?.headline && (
        <p className="text-xs text-white/80 dark:text-white/80 leading-relaxed mb-4 bg-white/5 p-2.5 rounded-apple-sm border border-white/10">
          "{card.headline}"
        </p>
      )}

      {/* Quick Action Buttons (Call, Email, Web, Location) */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {card?.phone && (
          <a
            href={`tel:${card.phone.replace(/[^\d+().\s-]/g, "")}`}
            className={`flex flex-col items-center justify-center py-2.5 rounded-apple-md border transition-all ${currentTheme.buttonBg}`}
            title="Call"
          >
            <Phone className="w-4 h-4 mb-1 text-emerald-400" />
            <span className="text-[10px] font-medium opacity-80">Call</span>
          </a>
        )}
        {card?.email && (
          <a
            href={`mailto:${encodeURIComponent(card.email.trim())}`}
            className={`flex flex-col items-center justify-center py-2.5 rounded-apple-md border transition-all ${currentTheme.buttonBg}`}
            title="Email"
          >
            <Mail className="w-4 h-4 mb-1 text-blue-400" />
            <span className="text-[10px] font-medium opacity-80">Email</span>
          </a>
        )}
        {card?.website && (
          <a
            href={sanitizeUrl(card.website)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center justify-center py-2.5 rounded-apple-md border transition-all ${currentTheme.buttonBg}`}
            title="Website"
          >
            <Globe className="w-4 h-4 mb-1 text-purple-400" />
            <span className="text-[10px] font-medium opacity-80">Site</span>
          </a>
        )}
        {card?.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(card.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center justify-center py-2.5 rounded-apple-md border transition-all ${currentTheme.buttonBg}`}
            title="Location"
          >
            <MapPin className="w-4 h-4 mb-1 text-rose-400" />
            <span className="text-[10px] font-medium opacity-80">Map</span>
          </a>
        )}
      </div>

      {/* Social Links Row */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {socials.linkedin && (
          <a
            href={sanitizeUrl(socials.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 ${currentTheme.chipBg}`}
          >
            <LinkedinIcon className="w-4 h-4" />
          </a>
        )}
        {socials.twitter && (
          <a
            href={sanitizeUrl(socials.twitter)}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 ${currentTheme.chipBg}`}
          >
            <TwitterIcon className="w-3.5 h-3.5" />
          </a>
        )}
        {socials.github && (
          <a
            href={sanitizeUrl(socials.github)}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 ${currentTheme.chipBg}`}
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        )}

        {socials.whatsapp && (
          <a
            href={`https://wa.me/${socials.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all hover:scale-105 ${currentTheme.chipBg}`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </a>
        )}
      </div>

      {/* Custom Action Buttons (e.g. Schedule Call, Portfolio) */}
      {buttons.length > 0 && (
        <div className="space-y-2 mb-5">
          {buttons.map((btn, idx) => (
            <a
              key={idx}
              href={sanitizeUrl(btn.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-apple-md border text-xs font-semibold tracking-wide transition-all hover:scale-[1.01] ${currentTheme.buttonBg}`}
            >
              <span>{btn.label}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          ))}
        </div>
      )}

      {/* Apple-styled "Add to Contacts" Button */}
      <div className="pt-2">
        <a
          href={getPublicCardVcardUrl(card?.slug || "alex-morgan")}
          download
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-apple-lg bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Save to Apple / Android Contacts</span>
        </a>
      </div>
    </div>
  );
}
