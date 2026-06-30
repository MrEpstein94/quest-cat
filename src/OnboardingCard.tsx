type OnboardingCardProps = {
  onLoadStarterPack: () => void;
  onAddFirstDaily: () => void;
  onAddFirstSideQuest: () => void;
  onAddFirstMainQuest: () => void;
};

export function OnboardingCard({
  onLoadStarterPack,
  onAddFirstDaily,
  onAddFirstSideQuest,
  onAddFirstMainQuest,
}: OnboardingCardProps) {
  return (
    <section className="section">
      <article className="hero-card onboarding-card">
        <p className="eyebrow">SYSTEM ONLINE</p>
        <h2>Awaken your hunter profile</h2>
        <p className="hero-copy">
          Start with a preset mission pack or create your first daily training, gate run, or boss raid.
        </p>
        <div className="onboarding-actions">
          <button className="primary-button" onClick={onLoadStarterPack} type="button">
            Load Hunter Pack
          </button>
          <button className="ghost-button" onClick={onAddFirstDaily} type="button">
            Add Training
          </button>
          <button className="ghost-button" onClick={onAddFirstSideQuest} type="button">
            Add Gate Run
          </button>
          <button className="ghost-button" onClick={onAddFirstMainQuest} type="button">
            Add Boss Raid
          </button>
        </div>
      </article>
    </section>
  );
}
