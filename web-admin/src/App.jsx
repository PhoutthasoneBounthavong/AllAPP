import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import CardsVault from "./components/CardsVault";
import CardDesigner from "./components/CardDesigner";
import QuickScanner from "./components/QuickScanner";
import ShareModal from "./components/ShareModal";
import PublicCardView from "./components/PublicCardView";
import { fetchDigitalCard, fetchScannedCards } from "./api";

export default function App() {
  const [activeTab, setActiveTab] = useState("vault"); // 'vault' | 'studio' | 'scanner' | 'share'
  const [darkMode, setDarkMode] = useState(false);
  const [digitalCard, setDigitalCard] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if viewing a public card directly (e.g. /c/alex-morgan)
  const pathname = window.location.pathname;
  const publicMatch = pathname.match(/^\/c\/([^\/]+)/);
  const publicSlug = publicMatch ? publicMatch[1] : null;

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load initial data
  const loadData = async () => {
    try {
      const [digRes, cardsRes] = await Promise.all([
        fetchDigitalCard().catch(() => ({ card: null })),
        fetchScannedCards().catch(() => ({ cards: [] })),
      ]);
      setDigitalCard(digRes.card);
      setCards(cardsRes.cards || []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!publicSlug) {
      loadData();
    }
  }, [publicSlug]);

  // If public card page, render public view directly
  if (publicSlug) {
    return <PublicCardView slug={publicSlug} />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-200">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <main className="pb-[max(4rem,calc(2.5rem+env(safe-area-inset-bottom,0px)))] animate-in fade-in duration-200">
        {activeTab === "vault" && (
          <CardsVault
            cards={cards}
            onRefresh={loadData}
            onSelectCard={() => {}}
          />
        )}

        {activeTab === "studio" && (
          <CardDesigner
            initialCard={digitalCard}
            onCardUpdated={(updated) => setDigitalCard(updated)}
          />
        )}

        {activeTab === "scanner" && (
          <QuickScanner
            onCardSaved={() => {
              loadData();
              setActiveTab("vault");
            }}
          />
        )}

        {activeTab === "share" && <ShareModal card={digitalCard} />}
      </main>
    </div>
  );
}
