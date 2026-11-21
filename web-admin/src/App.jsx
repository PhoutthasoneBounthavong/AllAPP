import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import AdminOverview from "./components/AdminOverview";
import UserRoleManagement from "./components/UserRoleManagement";
import DatabaseConfig from "./components/DatabaseConfig";
import CardsVault from "./components/CardsVault";
import PublicCardView from "./components/PublicCardView";
import { fetchScannedCards } from "./api";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'users' | 'database' | 'vault'
  const [darkMode, setDarkMode] = useState(true);
  const [cards, setCards] = useState([]);

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
      const cardsRes = await fetchScannedCards().catch(() => ({ cards: [] }));
      setCards(cardsRes.cards || []);
    } catch (err) {
      console.error("Failed to load initial data", err);
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
        {activeTab === "overview" && (
          <AdminOverview onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === "users" && <UserRoleManagement />}

        {activeTab === "database" && <DatabaseConfig />}

        {activeTab === "vault" && (
          <CardsVault
            cards={cards}
            onRefresh={loadData}
            onSelectCard={() => {}}
          />
        )}
      </main>
    </div>
  );
}
