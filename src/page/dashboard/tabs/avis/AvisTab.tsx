import { useState, useEffect, useMemo } from "react";
import {
  loadAvis,
  validateAvis,
  invalidateAvis,
  deleteAvis,
} from "../../../../lib/avis";
import type { Avis } from "../../../../types/avis";
import ConfirmModal from "../../../../components/confirm/ConfirmModal";
import Pagination, { getTotalPages } from "../../../../components/pagination/Pagination";
import { Button } from "../../../../components/button/Button";
import "./AvisTab.css";

const AVIS_PAGE_SIZE = 8;

export default function AvisTab() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagePending, setPagePending] = useState(1);
  const [pageApproved, setPageApproved] = useState(1);

  const enAttente = useMemo(
    () => avis.filter((a) => !a.valide),
    [avis],
  );
  const approuves = useMemo(() => avis.filter((a) => a.valide), [avis]);

  const totalPendingPages = useMemo(
    () => getTotalPages(enAttente.length, AVIS_PAGE_SIZE),
    [enAttente.length],
  );
  const totalApprovedPages = useMemo(
    () => getTotalPages(approuves.length, AVIS_PAGE_SIZE),
    [approuves.length],
  );

  useEffect(() => {
    setPagePending((p) => Math.min(p, totalPendingPages));
  }, [totalPendingPages]);

  useEffect(() => {
    setPageApproved((p) => Math.min(p, totalApprovedPages));
  }, [totalApprovedPages]);

  const enAttentePage = useMemo(
    () =>
      enAttente.slice(
        (pagePending - 1) * AVIS_PAGE_SIZE,
        pagePending * AVIS_PAGE_SIZE,
      ),
    [enAttente, pagePending],
  );
  const approuvesPage = useMemo(
    () =>
      approuves.slice(
        (pageApproved - 1) * AVIS_PAGE_SIZE,
        pageApproved * AVIS_PAGE_SIZE,
      ),
    [approuves, pageApproved],
  );

  const fetchAvis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadAvis();
      setAvis(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors du chargement des avis.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvis();
  }, []);

  const handleValidate = async (id: string) => {
    try {
      setActionLoading(id);
      await validateAvis(id);
      await fetchAvis();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la validation.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvalidate = async (id: string) => {
    try {
      setActionLoading(id);
      await invalidateAvis(id);
      await fetchAvis();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'invalidation.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setActionLoading(confirmDeleteId);
      await deleteAvis(confirmDeleteId);
      await fetchAvis();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la suppression.",
      );
    } finally {
      setActionLoading(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const renderAvisItem = (a: Avis) => {
    const isExpanded = expandedId === a.id;
    return (
      <div
        key={a.id}
        className={`avis-accordion-item ${a.valide ? "avis-accordion-item--valide" : ""} ${isExpanded ? "avis-accordion-item--open" : ""}`}
      >
        <div className="avis-accordion-header-row">
          <div
            role="button"
            tabIndex={0}
            className="avis-accordion-trigger"
            onClick={() => setExpandedId(isExpanded ? null : a.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpandedId(isExpanded ? null : a.id);
              }
            }}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? `Réduire l'avis de ${a.prenom}`
                : `Développer l'avis de ${a.prenom}`
            }
          >
            <span className="avis-accordion-trigger-inner">
              <span className="avis-accordion-author">
                {a.prenom} {a.nom}
              </span>
              <span className="avis-accordion-meta">
                {a.typeSeance} • {formatDate(a.createdAt)}
              </span>
            </span>
          </div>
          <span className="avis-accordion-actions-inline">
            {a.valide ? (
              <button
                type="button"
                className="avis-accordion-btn-icon avis-accordion-btn-icon--invalidate"
                onClick={() => handleInvalidate(a.id)}
                disabled={actionLoading === a.id}
                title="Retirer de la publication"
                aria-label="Retirer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="avis-accordion-btn-icon avis-accordion-btn-icon--approve"
                onClick={() => handleValidate(a.id)}
                disabled={actionLoading === a.id}
                title="Valider et publier"
                aria-label="Approuver"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="avis-accordion-btn-icon avis-accordion-btn-icon--delete"
              onClick={() => handleDeleteClick(a.id)}
              disabled={actionLoading === a.id}
              title="Supprimer"
              aria-label="Supprimer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <span className="avis-accordion-icon" aria-hidden>
              {isExpanded ? "−" : "+"}
            </span>
          </span>
        </div>
        <div className="avis-accordion-panel" hidden={!isExpanded}>
          <div
            className="avis-accordion-stars"
            aria-label={`Note : ${a.note} sur 5`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={
                  a.note >= n ? "avis-star avis-star--filled" : "avis-star"
                }
              >
                ★
              </span>
            ))}
          </div>
          <p className="avis-accordion-text">{a.avis}</p>
          <div className="avis-accordion-actions">
            {a.valide ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="btn-avis-invalidate"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInvalidate(a.id);
                }}
                disabled={actionLoading === a.id}
                title="Retirer de la publication"
              >
                {actionLoading === a.id ? "…" : "Retirer"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="btn-avis-validate"
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidate(a.id);
                }}
                disabled={actionLoading === a.id}
                title="Publier sur la page Témoignages"
              >
                {actionLoading === a.id ? "…" : "Valider"}
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="btn-avis-delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(a.id);
              }}
              disabled={actionLoading === a.id}
              title="Supprimer définitivement"
            >
              {actionLoading === a.id ? "…" : "Supprimer"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-tab-content">
        <div className="dashboard-card">
          <div className="avis-loading">Chargement des avis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-tab-content">
      <div className="dashboard-card avis-card">
        <header className="dashboard-page-header">
          <span className="dashboard-page-header-accent" aria-hidden="true" />
          <div className="dashboard-page-header-text">
            <h2 className="dashboard-page-title">Gestion des avis</h2>
            <p className="dashboard-page-tagline">Modération des témoignages</p>
            <p className="dashboard-page-intro avis-intro">
              Modérez les témoignages. Seuls les avis validés apparaissent sur
              la page Témoignages.
            </p>
          </div>
        </header>

        {error && (
          <div className="avis-error">
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        )}

        {avis.length === 0 ? (
          <p className="dashboard-empty">Aucun avis pour le moment.</p>
        ) : (
          <div className="avis-sections">
            {enAttente.length > 0 && (
              <section className="avis-section">
                <h3 className="avis-section-title">
                  En attente de validation
                </h3>
                <div className="avis-accordion">
                  {enAttentePage.map(renderAvisItem)}
                </div>
                <Pagination
                  currentPage={pagePending}
                  totalPages={totalPendingPages}
                  onPageChange={setPagePending}
                  variant="dashboard"
                  className="avis-tab-pagination"
                  ariaLabel="Pagination des avis en attente"
                />
              </section>
            )}
            {approuves.length > 0 && (
              <section className="avis-section">
                <h3 className="avis-section-title">Approuvés</h3>
                <div className="avis-accordion">
                  {approuvesPage.map(renderAvisItem)}
                </div>
                <Pagination
                  currentPage={pageApproved}
                  totalPages={totalApprovedPages}
                  onPageChange={setPageApproved}
                  variant="dashboard"
                  className="avis-tab-pagination"
                  ariaLabel="Pagination des avis approuvés"
                />
              </section>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
          title="Supprimer l'avis"
          message="Supprimer définitivement cet avis ?"
          confirmLabel="Supprimer"
          variant="danger"
        />
      </div>
    </div>
  );
}
