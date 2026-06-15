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
        <p className="eyebrow">NEW PROFILE</p>
        <h2>Start fast</h2>
        <p className="hero-copy">
          This profile is empty. Load a starter pack or add one quick quest before opening the full forge.
        </p>
        <div className="onboarding-actions">
          <button className="primary-button" onClick={onLoadStarterPack} type="button">
            Load Starter Pack
          </button>
          <button className="ghost-button" onClick={onAddFirstDaily} type="button">
            Add First Daily
          </button>
          <button className="ghost-button" onClick={onAddFirstSideQuest} type="button">
            Add First Side Quest
          </button>
          <button className="ghost-button" onClick={onAddFirstMainQuest} type="button">
            Add First Main Quest
          </button>
        </div>
      </article>
    </section>
  );
}
