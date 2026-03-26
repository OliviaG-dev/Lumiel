import './AboutPage.css'

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-content">
        <h1>À propos</h1>
        <p className="about-lead">
          Je propose un accompagnement centré sur le bien-être, l’écoute du corps et l’harmonisation
          des ressentis — dans le respect de votre rythme et de votre histoire. Mon cadre de travail
          mêle des pratiques orientées énergie et relaxation à une présence attentive, sans promesse
          de guérison ni de résultat garanti.
        </p>

        <div className="about-section">
          <h2>Mon approche</h2>
          <p>
            Chaque personne arrive avec son propre vécu : fatigue diffuse, tensions, périodes de
            transition, besoin de silence ou de clarification intérieure. Je privilégie un échange
            sincère en amont de la séance afin de comprendre ce que vous recherchez aujourd’hui —
            apaisement, recentrage, ou simplement un espace où vous pouvez vous poser sans jugement.
          </p>
          <p>
            Les séances se déroulent dans la douceur : accueil de ce que vous ressentez,
            possibilité de verbaliser ou de rester dans une dimension plus corporelle, selon ce qui
            vous convient. L’objectif n’est pas de « réparer » une personne, mais de soutenir un
            mieux-être relatif, parfois modeste mais souvent précieux au quotidien.
          </p>
        </div>

        <div className="about-section">
          <h2>Cadre et honnêteté</h2>
          <p>
            Les soins énergétiques et le bien-être holistique <strong>ne remplacent pas</strong> un
            avis médical, un diagnostic ou un traitement prescrit. En cas de douleur aiguë, symptômes
            inquiétants ou pathologie suivie, il est essentiel de consulter un professionnel de
            santé. Mon accompagnement peut coexister avec une prise en charge médicale lorsque la
            situation le permet, mais il reste du domaine du bien-être, pas du soin curatif au sens
            médical.
          </p>
          <ul className="about-list">
            <li>Écoute active et confidentialité dans les limites légales habituelles</li>
            <li>Pas de conseil médical, pas de modification de traitement sans l’avis d’un médecin</li>
            <li>Droit de mettre fin à une séance ou à un accompagnement à tout moment</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>Parcours et pratique</h2>
          <p>
            J’ai construit ma pratique autour de formations et de supervisons continues dans les
            domaines du magnétisme, du travail avec les ressentis et des techniques favorisant la
            relaxation et l’ancrage. Cette exigence de démarche sérieuse me semble indispensable
            lorsqu’on tient un espace d’accueil pour autrui : mise à jour des connaissances,
            réflexion éthique, et humilité face à ce qu’une séance peut ou ne peut pas apporter.
          </p>
          <p>
            Je continue d’échanger avec des pairs et de parfaire mon cadre de pratique afin de
            rester alignée avec les attentes légitimes du public et avec mon propre engagement
            professionnel.
          </p>
        </div>

        <div className="about-section about-section--closing">
          <h2>Vous souhaitez en discuter ?</h2>
          <p>
            Si cette manière de travailler résonne avec vous, vous pouvez consulter les prestations
            et prendre rendez-vous depuis le site. La première prise de contact est aussi
            l’occasion de vérifier ensemble si mon accompagnement correspond à votre besoin du
            moment.
          </p>
        </div>
      </section>
    </div>
  )
}
