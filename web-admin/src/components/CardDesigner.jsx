import React, { useState } from "react";
import {
  Palette,
  User,
  Briefcase,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Check,
  Smartphone,
  Eye,
} from "lucide-react";
import confetti from "canvas-confetti";
import DigitalCardPreview from "./DigitalCardPreview";
import { updateDigitalCard } from "../api";

export default function CardDesigner({ initialCard, onCardUpdated }) {
  const [formData, setFormData] = useState({
    full_name: initialCard?.full_name || "Business Card",
    job_title: initialCard?.job_title || "Chief Executive Officer & Founder",
    company: initialCard?.company || "SBusinessCard Inc.",
    headline: initialCard?.headline || "Designing next-generation spatial computing & AI systems.",
    bio: initialCard?.bio || "",
    theme: initialCard?.theme || "apple_dark",
    badge_text: initialCard?.badge_text || "Staff",
    phone: initialCard?.phone || "+1 (555) 234-5678",
    email: initialCard?.email || "alex.morgan@sbusinesscard.app",
    website: initialCard?.website || "https://sbusinesscard.app",
    address: initialCard?.address || "1 Infinite Loop, Cupertino, CA 95014",
    social_links: initialCard?.social_links || {
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
      github: "https://github.com",
      whatsapp: "+15552345678",
    },
    custom_buttons: initialCard?.custom_buttons || [
      { label: "Book a Demo", url: "https://calendly.com" },
      { label: "Executive Portfolio", url: "https://apple.com" },
    ],
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const themes = [
    { id: "apple_dark", label: "Apple Slate", preview: "bg-[#1C1C1E] border-white/20 text-white" },
    { id: "apple_light", label: "Ceramic Light", preview: "bg-white border-black/10 text-[#1D1D1F]" },
    { id: "midnight", label: "Midnight Sapphire", preview: "bg-[#0B1528] border-blue-500/30 text-cyan-300" },
    { id: "emerald", label: "Emerald Luxury", preview: "bg-[#0A2619] border-emerald-500/30 text-emerald-300" },
    { id: "aurora", label: "Cupertino Aurora", preview: "bg-[#2D124D] border-fuchsia-500/30 text-fuchsia-300" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (network, value) => {
    setFormData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [network]: value,
      },
    }));
  };

  const handleAddButton = () => {
    setFormData((prev) => ({
      ...prev,
      custom_buttons: [...prev.custom_buttons, { label: "New Link", url: "https://" }],
    }));
  };

  const handleUpdateButton = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.custom_buttons];
      updated[index][field] = value;
      return { ...prev, custom_buttons: updated };
    });
  };

  const handleRemoveButton = (index) => {
    setFormData((prev) => ({
      ...prev,
      custom_buttons: prev.custom_buttons.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateDigitalCard(formData);
      setSaving(false);
      setSaveSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
      if (onCardUpdated) onCardUpdated(res.card);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Error saving card: " + err.message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <span>Card Studio Designer</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0071E3]/20 dark:text-[#409CFF]">
              Live 3D Preview
            </span>
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Customize your shareable digital business card. Real-time sync to your public URL and QR code.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-apple-md bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Synced Successfully</span>
            </>
          ) : saving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Customizer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Theme Picker */}
          <div className="apple-glass rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08]">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-[#0071E3]" />
              Card Aesthetic & Material
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFormData((prev) => ({ ...prev, theme: t.id }))}
                  className={`flex items-center gap-3 p-3 rounded-apple-md border text-left transition-all ${formData.theme === t.id
                      ? "ring-2 ring-[#0071E3] border-transparent shadow-sm"
                      : "border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20"
                    }`}
                >
                  <div className={`w-6 h-6 rounded-apple-sm border ${t.preview} shadow-sm shrink-0`} />
                  <span className="text-xs font-medium truncate text-[#1D1D1F] dark:text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Identity Information */}
          <div className="apple-glass rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0071E3]" />
              Professional Identity
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Job Title / Role</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Company Name</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Badge Text (Optional)</label>
                <input
                  type="text"
                  name="badge_text"
                  value={formData.badge_text}
                  onChange={handleInputChange}
                  placeholder="e.g. Staff / Verified"
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Headline / Value Prop</label>
              <textarea
                name="headline"
                rows="2"
                value={formData.headline}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] resize-none"
              />
            </div>
          </div>

          {/* 3. Direct Contact Channels */}
          <div className="apple-glass rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0071E3]" />
              Contact Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Website</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#86868B] mb-1 block">Office Location</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>
            </div>
          </div>

          {/* 4. Social Handles & Custom Links */}
          <div className="apple-glass rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0071E3]" />
                Custom Action Buttons
              </label>
              <button
                onClick={handleAddButton}
                className="flex items-center gap-1 text-xs text-[#0071E3] hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.custom_buttons.map((btn, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => handleUpdateButton(idx, "label", e.target.value)}
                    placeholder="Button Label"
                    className="w-1/3 px-3 py-1.5 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <input
                    type="text"
                    value={btn.url}
                    onChange={(e) => handleUpdateButton(idx, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <button
                    onClick={() => handleRemoveButton(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-apple-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Apple iPhone 16 Mockup Frame (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 flex flex-col items-center">
          <div className="text-center mb-3">
            <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#0071E3]" />
              Live Mobile Simulator
            </span>
          </div>

          {/* iPhone Outer Chassis */}
          <div className="relative w-full max-w-[340px] mx-auto rounded-[48px] p-3 bg-gradient-to-b from-[#48484A] via-[#2C2C2E] to-[#1C1C1E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-[#3A3A3C]">
            {/* Volume / Power buttons simulation */}
            <div className="absolute -left-[7px] top-28 w-[3px] h-10 bg-[#3A3A3C] rounded-l" />
            <div className="absolute -left-[7px] top-42 w-[3px] h-12 bg-[#3A3A3C] rounded-l" />
            <div className="absolute -right-[7px] top-32 w-[3px] h-16 bg-[#3A3A3C] rounded-r" />

            {/* Screen Bezel */}
            <div className="relative rounded-[40px] bg-black overflow-hidden p-3 min-h-[620px] flex flex-col justify-between">
              {/* Dynamic Island */}
              <div className="flex justify-center pt-1 pb-3">
                <div className="w-24 h-6 rounded-full bg-black border border-white/10 flex items-center justify-between px-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-950/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
              </div>

              {/* Digital Card Preview inside iPhone */}
              <div className="flex-1 flex items-center justify-center py-2">
                <DigitalCardPreview card={formData} isInteractive={false} />
              </div>

              {/* iPhone Home Bar */}
              <div className="flex justify-center pb-1 pt-2">
                <div className="w-32 h-1 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
