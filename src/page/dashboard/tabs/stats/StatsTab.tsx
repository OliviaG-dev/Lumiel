export default function StatsTab() {
  return (
    <div className="dashboard-tab-content">
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">0</span>
          <span className="dashboard-stat-label">Avis</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">0</span>
          <span className="dashboard-stat-label">Prestations réalisées</span>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Prestations par type</h2>
        <p className="dashboard-empty">
          Aucune prestation enregistrée. Les données apparaîtront ici une fois connectées à Supabase.
        </p>
      </div>

      <div className="dashboard-card">
        <h2>Rendez-vous à venir</h2>
        <p className="dashboard-empty">
          Aucun rendez-vous à venir. Les rendez-vous apparaîtront ici une fois le calendrier connecté.
        </p>
      </div>
    </div>
  )
}
