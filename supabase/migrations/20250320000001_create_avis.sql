-- Table avis : témoignages soumis par les clients
CREATE TABLE IF NOT EXISTS avis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom text NOT NULL,
  nom text NOT NULL,
  note integer NOT NULL CHECK (note >= 1 AND note <= 5),
  type_seance text NOT NULL,
  avis text NOT NULL,
  valide boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour filtrer les avis validés sur la page publique
CREATE INDEX IF NOT EXISTS idx_avis_valide ON avis (valide);

-- RLS : activer
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;

-- Politique : visiteurs anonymes et connectés peuvent insérer (soumission d'avis depuis la page Témoignages)
CREATE POLICY "avis_insert_anon" ON avis FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "avis_insert_authenticated" ON avis FOR INSERT TO authenticated WITH CHECK (true);

-- Politique : tout le monde peut lire les avis validés uniquement
CREATE POLICY "avis_select_anon" ON avis FOR SELECT TO anon USING (valide = true);
CREATE POLICY "avis_select_authenticated" ON avis FOR SELECT TO authenticated USING (valide = true);

-- Fonction helper : vérifie si l'utilisateur connecté est admin (table admins doit exister)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Politique : les admins peuvent tout lire, modifier et supprimer
CREATE POLICY "avis_admin_select" ON avis FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY "avis_admin_update" ON avis FOR UPDATE TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "avis_admin_delete" ON avis FOR DELETE TO authenticated
  USING (is_admin_user());
