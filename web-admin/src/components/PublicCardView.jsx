import React, { useEffect, useState } from "react";
import { getPublicCard } from "../api";
import DigitalCardPreview from "./DigitalCardPreview";
import { CreditCard, Sparkles, AlertCircle } from "lucide-react";

export default function PublicCardView({ slug }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCard() {
      try {
        const res = await getPublicCard(slug);
        setCard(res.card);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadCard();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-apple-md bg-[#0071E3] animate-pulse flex items-center justify-center text-white">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-[#86868B]">Loading contact card...</span>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-[100dvh] bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="apple-glass rounded-apple-xl p-8 max-w-sm w-full text-center border border-black/10 dark:border-white/10">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white">Card Not Found</h2>
          <p className="text-xs text-[#86868B] mt-1">This digital business card profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F7] dark:bg-[#0A0A0C] flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-apple-sm bg-[#0071E3] flex items-center justify-center text-white">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-tight text-[#1D1D1F] dark:text-white">Cardr</span>
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          Live Contact
        </span>
      </div>

      {/* Main Digital Card */}
      <div className="my-auto py-4 w-full flex justify-center">
        <DigitalCardPreview card={card} isInteractive={true} />
      </div>

      {/* Footer with safe area avoidance */}
      <footer className="w-full max-w-sm text-center py-4">
        <p className="text-[11px] text-[#86868B]">
          Powered by <strong className="text-[#1D1D1F] dark:text-white">Cardr Studio</strong> Digital Business Cards Scanner
        </p>
      </footer>
    </div>
  );
}
