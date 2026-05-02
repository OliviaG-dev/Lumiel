import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isAdmin } from '@/lib/supabase'
import type { User } from "@supabase/supabase-js";
import {
  type TabId,
  StatsTab,
  BlogTab,
  AvisTab,
  CalendrierTab,
  PrestationsTab,
  ClientsTab,
} from "./tabs";
import "./DashboardPage.css";
import { Button, ButtonLink } from '@/components/button/Button'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [navOpen, setNavOpen] = useState(false);
  const [compactNav, setCompactNav] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1024px)").matches,
  );
  const navigate = useNavigate();

  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((o) => !o), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const apply = () => setCompactNav(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1025px)");
    const onChange = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    if (!compactNav || !navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [compactNav, navOpen]);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        navigate("/login");
        return;
      }
      // Déporter les appels async hors du callback pour éviter les blocages Supabase Auth
      const email = session.user.email ?? "";
      setTimeout(async () => {
        if (!mounted) return;
        try {
          const admin = await isAdmin(email);
          if (!mounted) return;
          if (!admin) {
            await supabase.auth.signOut();
            navigate("/login");
            return;
          }
          setUser(session.user);
        } catch {
          if (mounted) navigate("/login");
        } finally {
          if (mounted) setLoading(false);
        }
      }, 50);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: "stats", label: "Statistiques" },
    { id: "blog", label: "Blog" },
    { id: "avis", label: "Avis" },
    { id: "calendrier", label: "Calendrier" },
    { id: "prestations", label: "Prestations" },
    { id: "clients", label: "Clients" },
  ];

  const activeTabLabel =
    tabs.find((t) => t.id === activeTab)?.label ?? "Tableau de bord";

  const tabContent: Record<TabId, React.ReactNode> = {
    stats: <StatsTab />,
    blog: <BlogTab />,
    avis: <AvisTab />,
    calendrier: <CalendrierTab />,
    prestations: <PrestationsTab />,
    clients: <ClientsTab />,
  };

  return (
    <div
      className={`dashboard-page${navOpen ? " dashboard-page--nav-open" : ""}`}
    >
      <header className="dashboard-mobile-bar">
        <button
          type="button"
          className={`dashboard-nav-toggle${navOpen ? " dashboard-nav-toggle--open" : ""}`}
          onClick={toggleNav}
          aria-expanded={navOpen}
          aria-controls="dashboard-sidebar-nav"
          aria-label={navOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg
            className="dashboard-nav-toggle-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {navOpen ? (
              <>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </>
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
        <span className="dashboard-mobile-title">{activeTabLabel}</span>
      </header>

      <div
        className="dashboard-sidebar-backdrop"
        aria-hidden={!navOpen}
        onClick={closeNav}
      />

      <aside
        className="dashboard-sidebar"
        id="dashboard-sidebar-nav"
        aria-hidden={compactNav && !navOpen}
      >
        <div className="dashboard-sidebar-header">
          <h1>Tableau de bord</h1>
          <p className="dashboard-welcome">Administration</p>
          <Button
            type="button"
            variant="outline"
            pill
            block
            onClick={handleSignOut}
          >
            Déconnexion
          </Button>
        </div>
        <nav className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-tab ${activeTab === tab.id ? "dashboard-tab--active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                closeNav();
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <ButtonLink
          to="/"
          variant="outline"
          block
          className="dashboard-home-btn"
          onClick={closeNav}
        >
          Retour à l'accueil
        </ButtonLink>
      </aside>

      <main className="dashboard-main">{tabContent[activeTab]}</main>
    </div>
  );
}
