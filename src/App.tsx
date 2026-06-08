const dailyQuests = [
  { title: 'Drink water', xp: 10, done: true },
  { title: 'Clear inbox', xp: 20, done: false },
  { title: '30 minute workout', xp: 35, done: false },
  { title: 'Plan tomorrow', xp: 15, done: false },
];

const sideQuests = [
  {
    title: 'Reply to one lingering text',
    xp: 8,
    difficulty: 'Quick win',
    reward: '15 minutes guilt-free scrolling',
    objectives: ['Pick one person', 'Send the message', 'Archive the thread'],
  },
  {
    title: 'Tidy one small surface',
    xp: 12,
    difficulty: 'Easy',
    reward: 'Fresh coffee after cleanup',
    objectives: ['Choose one desk or counter', 'Throw away trash', 'Put items back'],
  },
  {
    title: 'Read 10 pages',
    xp: 18,
    difficulty: 'Medium',
    reward: 'New sticker unlock',
    objectives: ['Set a 15-minute timer', 'Read without phone', 'Log one takeaway'],
  },
];

const mainQuests = [
  {
    title: 'Hit a 5-day streak',
    progress: '3 / 5 days',
    reward: 'Weekend cafe visit',
    objectives: ['Finish 3 daily quests each day', 'Keep the streak alive tonight'],
  },
  {
    title: 'Launch Quest Cat v1',
    progress: 'Setup phase',
    reward: 'Buy a custom cat icon pack',
    objectives: ['Finish quest list layout', 'Define reward system', 'Ship first installable build'],
  },
];

const completedCount = dailyQuests.filter((quest) => quest.done).length;
const earnedXp = dailyQuests
  .filter((quest) => quest.done)
  .reduce((total, quest) => total + quest.xp, 0);
const sideQuestXp = sideQuests.reduce((total, quest) => total + quest.xp, 0);

const baseXp = 180;
const totalXp = baseXp + earnedXp;

const rankTitles = [
  'Tiny Paws',
  'Alley Scout',
  'Whisker Squire',
  'Moonlight Hunter',
  'Legend Cat',
];

function getXpRequiredForLevel(level: number) {
  return 60 + (level - 1) * 30;
}

function getRankProgress(total: number) {
  let level = 1;
  let spentXp = 0;
  let nextLevelXp = getXpRequiredForLevel(level);

  while (total >= spentXp + nextLevelXp) {
    spentXp += nextLevelXp;
    level += 1;
    nextLevelXp = getXpRequiredForLevel(level);
  }

  const currentLevelXp = total - spentXp;
  const progressPercent = Math.round((currentLevelXp / nextLevelXp) * 100);

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    rankTitle: rankTitles[Math.min(level - 1, rankTitles.length - 1)],
  };
}

const rankProgress = getRankProgress(totalXp);

export default function App() {
  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">TODAY&apos;S ADVENTURE</p>
        <h1>Quest Cat</h1>
        <p className="hero-copy">
          A reminder-style home screen for your day, but with quests, streaks, and XP.
        </p>

        <div className="hero-stats">
          <article className="stat-card">
            <span className="stat-value">Lv. {rankProgress.level}</span>
            <span className="stat-label">{rankProgress.rankTitle}</span>
          </article>
          <article className="stat-card">
            <span className="stat-value">{earnedXp} XP</span>
            <span className="stat-label">Earned Today</span>
          </article>
        </div>

        <section className="rank-panel" aria-label="Rank progress">
          <div className="rank-copy">
            <strong>Rank Progress</strong>
            <span>
              {rankProgress.currentLevelXp} / {rankProgress.nextLevelXp} XP to next level
            </span>
          </div>
          <div className="rank-bar" aria-hidden="true">
            <span style={{ width: `${rankProgress.progressPercent}%` }} />
          </div>
          <p className="rank-note">
            Total XP is lifetime XP. Each level needs 30 more XP than the last one.
          </p>
        </section>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Daily Quests</h2>
          <span>
            {completedCount} of {dailyQuests.length} cleared
          </span>
        </div>

        <div className="card-stack">
          {dailyQuests.map((quest) => (
            <article className="task-card" key={quest.title}>
              <span className={`task-marker ${quest.done ? 'is-done' : ''}`} aria-hidden="true" />
              <div className="task-copy">
                <strong>{quest.title}</strong>
                <small>+{quest.xp} XP</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Side Quests</h2>
          <span>Worth {sideQuestXp} bonus XP</span>
        </div>

        <div className="card-stack">
          {sideQuests.map((quest) => (
            <article className="goal-card side-quest-card" key={quest.title}>
              <div className="quest-card-copy">
                <div className="quest-card-header">
                  <div className="task-copy">
                    <strong>{quest.title}</strong>
                    <small>{quest.difficulty}</small>
                  </div>
                  <span className="side-quest-xp">+{quest.xp} XP</span>
                </div>
                <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                  {quest.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
                <p className="reward-pill">Reward: {quest.reward}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Main Quests</h2>
          <span>Keep momentum</span>
        </div>

        <div className="card-stack">
          {mainQuests.map((quest) => (
            <article className="goal-card" key={quest.title}>
              <div className="quest-card-copy">
                <div className="quest-card-header">
                  <div>
                    <strong>{quest.title}</strong>
                    <small>{quest.progress}</small>
                  </div>
                </div>
                <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                  {quest.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
                <p className="reward-pill">Reward: {quest.reward}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <button className="primary-button" type="button">
        Add New Quest
      </button>

      <section className="install-tip" aria-label="Install instructions">
        <p>On iPhone: open this site in Safari, tap Share, then Add to Home Screen.</p>
      </section>
    </main>
  );
}
