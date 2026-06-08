import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';

type DailyQuest = {
  id: string;
  title: string;
  xp: number;
  done: boolean;
};

type Objective = {
  id: string;
  title: string;
  done: boolean;
};

type Quest = {
  id: string;
  title: string;
  xp?: number;
  difficulty?: string;
  reward: string;
  done: boolean;
  objectives: Objective[];
};

const STORAGE_KEY = 'quest-cat-state-v1';

const rankTitles = [
  'Tiny Paws',
  'Alley Scout',
  'Whisker Squire',
  'Moonlight Hunter',
  'Legend Cat',
];

const baseXp = 180;

const defaultDailyQuests: DailyQuest[] = [
  { id: 'daily-1', title: 'Drink water', xp: 10, done: true },
  { id: 'daily-2', title: 'Clear inbox', xp: 20, done: false },
  { id: 'daily-3', title: '30 minute workout', xp: 35, done: false },
  { id: 'daily-4', title: 'Plan tomorrow', xp: 15, done: false },
];

const defaultSideQuests: Quest[] = [
  {
    id: 'side-1',
    title: 'Reply to one lingering text',
    xp: 8,
    difficulty: 'Quick win',
    reward: '15 minutes guilt-free scrolling',
    done: false,
    objectives: [
      { id: 'side-1-1', title: 'Pick one person', done: false },
      { id: 'side-1-2', title: 'Send the message', done: false },
      { id: 'side-1-3', title: 'Archive the thread', done: false },
    ],
  },
  {
    id: 'side-2',
    title: 'Tidy one small surface',
    xp: 12,
    difficulty: 'Easy',
    reward: 'Fresh coffee after cleanup',
    done: false,
    objectives: [
      { id: 'side-2-1', title: 'Choose one desk or counter', done: false },
      { id: 'side-2-2', title: 'Throw away trash', done: false },
      { id: 'side-2-3', title: 'Put items back', done: false },
    ],
  },
  {
    id: 'side-3',
    title: 'Read 10 pages',
    xp: 18,
    difficulty: 'Medium',
    reward: 'New sticker unlock',
    done: false,
    objectives: [
      { id: 'side-3-1', title: 'Set a 15-minute timer', done: false },
      { id: 'side-3-2', title: 'Read without phone', done: false },
      { id: 'side-3-3', title: 'Log one takeaway', done: false },
    ],
  },
];

const defaultMainQuests: Quest[] = [
  {
    id: 'main-1',
    title: 'Hit a 5-day streak',
    reward: 'Weekend cafe visit',
    done: false,
    objectives: [
      { id: 'main-1-1', title: 'Finish 3 daily quests each day', done: false },
      { id: 'main-1-2', title: 'Keep the streak alive tonight', done: false },
    ],
  },
  {
    id: 'main-2',
    title: 'Launch Quest Cat v1',
    reward: 'Buy a custom cat icon pack',
    done: false,
    objectives: [
      { id: 'main-2-1', title: 'Finish quest list layout', done: false },
      { id: 'main-2-2', title: 'Define reward system', done: false },
      { id: 'main-2-3', title: 'Ship first installable build', done: false },
    ],
  },
];

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

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

function getQuestCompletion(quest: Quest) {
  const objectiveCount = quest.objectives.length;
  const completedObjectives = quest.objectives.filter((objective) => objective.done).length;

  return {
    objectiveCount,
    completedObjectives,
    progressLabel:
      objectiveCount === 0 ? 'No sub quests yet' : `${completedObjectives} / ${objectiveCount} sub quests`,
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return {
      dailyQuests: defaultDailyQuests,
      sideQuests: defaultSideQuests,
      mainQuests: defaultMainQuests,
    };
  }

  const savedState = window.localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return {
      dailyQuests: defaultDailyQuests,
      sideQuests: defaultSideQuests,
      mainQuests: defaultMainQuests,
    };
  }

  try {
    return JSON.parse(savedState) as {
      dailyQuests: DailyQuest[];
      sideQuests: Quest[];
      mainQuests: Quest[];
    };
  } catch {
    return {
      dailyQuests: defaultDailyQuests,
      sideQuests: defaultSideQuests,
      mainQuests: defaultMainQuests,
    };
  }
}

export default function App() {
  const [initialState] = useState(loadInitialState);
  const [dailyQuests, setDailyQuests] = useState(initialState.dailyQuests);
  const [sideQuests, setSideQuests] = useState(initialState.sideQuests);
  const [mainQuests, setMainQuests] = useState(initialState.mainQuests);

  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyXp, setDailyXp] = useState('10');

  const [sideTitle, setSideTitle] = useState('');
  const [sideXp, setSideXp] = useState('10');
  const [sideDifficulty, setSideDifficulty] = useState('');
  const [sideReward, setSideReward] = useState('');
  const [sideObjectives, setSideObjectives] = useState('');

  const [mainTitle, setMainTitle] = useState('');
  const [mainReward, setMainReward] = useState('');
  const [mainObjectives, setMainObjectives] = useState('');

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dailyQuests, sideQuests, mainQuests }),
    );
  }, [dailyQuests, sideQuests, mainQuests]);

  const completedCount = dailyQuests.filter((quest) => quest.done).length;
  const earnedXp = dailyQuests
    .filter((quest) => quest.done)
    .reduce((total, quest) => total + quest.xp, 0);
  const sideQuestXp = sideQuests.reduce((total, quest) => total + (quest.xp ?? 0), 0);
  const totalXp = baseXp + earnedXp;
  const rankProgress = getRankProgress(totalXp);

  function addDailyQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = dailyTitle.trim();
    const xp = Number(dailyXp);

    if (!title || Number.isNaN(xp) || xp < 0) {
      return;
    }

    setDailyQuests((current) => [
      ...current,
      { id: createId('daily'), title, xp, done: false },
    ]);
    setDailyTitle('');
    setDailyXp('10');
  }

  function addSideQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = sideTitle.trim();
    const reward = sideReward.trim();
    const xp = Number(sideXp);
    const objectives = sideObjectives
      .split('\n')
      .map((objective) => objective.trim())
      .filter(Boolean)
      .map((objective) => ({
        id: createId('side-objective'),
        title: objective,
        done: false,
      }));

    if (!title || !reward || Number.isNaN(xp) || xp < 0) {
      return;
    }

    setSideQuests((current) => [
      ...current,
      {
        id: createId('side'),
        title,
        xp,
        difficulty: sideDifficulty.trim() || 'Custom',
        reward,
        done: false,
        objectives,
      },
    ]);
    setSideTitle('');
    setSideXp('10');
    setSideDifficulty('');
    setSideReward('');
    setSideObjectives('');
  }

  function addMainQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = mainTitle.trim();
    const reward = mainReward.trim();
    const objectives = mainObjectives
      .split('\n')
      .map((objective) => objective.trim())
      .filter(Boolean)
      .map((objective) => ({
        id: createId('main-objective'),
        title: objective,
        done: false,
      }));

    if (!title || !reward) {
      return;
    }

    setMainQuests((current) => [
      ...current,
      {
        id: createId('main'),
        title,
        reward,
        done: false,
        objectives,
      },
    ]);
    setMainTitle('');
    setMainReward('');
    setMainObjectives('');
  }

  function toggleDailyQuest(questId: string) {
    setDailyQuests((current) =>
      current.map((quest) => (quest.id === questId ? { ...quest, done: !quest.done } : quest)),
    );
  }

  function deleteDailyQuest(questId: string) {
    setDailyQuests((current) => current.filter((quest) => quest.id !== questId));
  }

  function toggleQuest(
    questId: string,
    setter: Dispatch<SetStateAction<Quest[]>>,
  ) {
    setter((current) =>
      current.map((quest) =>
        quest.id === questId
          ? {
              ...quest,
              done: !quest.done,
              objectives: quest.objectives.map((objective) => ({
                ...objective,
                done: !quest.done,
              })),
            }
          : quest,
      ),
    );
  }

  function toggleObjective(
    questId: string,
    objectiveId: string,
    setter: Dispatch<SetStateAction<Quest[]>>,
  ) {
    setter((current) =>
      current.map((quest) => {
        if (quest.id !== questId) {
          return quest;
        }

        const objectives = quest.objectives.map((objective) =>
          objective.id === objectiveId ? { ...objective, done: !objective.done } : objective,
        );
        const done = objectives.length > 0 && objectives.every((objective) => objective.done);

        return {
          ...quest,
          done,
          objectives,
        };
      }),
    );
  }

  function deleteQuest(questId: string, setter: Dispatch<SetStateAction<Quest[]>>) {
    setter((current) => current.filter((quest) => quest.id !== questId));
  }

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
            <article className={`task-card ${quest.done ? 'is-complete' : ''}`} key={quest.id}>
              <label className="check-row">
                <input
                  checked={quest.done}
                  onChange={() => toggleDailyQuest(quest.id)}
                  type="checkbox"
                />
                <span className={`task-marker ${quest.done ? 'is-done' : ''}`} aria-hidden="true" />
                <div className="task-copy">
                  <strong>{quest.title}</strong>
                  <small>+{quest.xp} XP</small>
                </div>
              </label>
              <button
                aria-label={`Delete ${quest.title}`}
                className="ghost-button danger-button"
                onClick={() => deleteDailyQuest(quest.id)}
                type="button"
              >
                Delete
              </button>
            </article>
          ))}
        </div>

        <form className="quest-form" onSubmit={addDailyQuest}>
          <h3>Add Daily Quest</h3>
          <input
            onChange={(event) => setDailyTitle(event.target.value)}
            placeholder="Quest title"
            value={dailyTitle}
          />
          <input
            min="0"
            onChange={(event) => setDailyXp(event.target.value)}
            placeholder="XP reward"
            type="number"
            value={dailyXp}
          />
          <button className="primary-button form-button" type="submit">
            Add Daily Quest
          </button>
        </form>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Side Quests</h2>
          <span>Worth {sideQuestXp} bonus XP</span>
        </div>

        <div className="card-stack">
          {sideQuests.map((quest) => {
            const completion = getQuestCompletion(quest);

            return (
              <article className={`goal-card side-quest-card ${quest.done ? 'is-complete' : ''}`} key={quest.id}>
                <div className="quest-card-copy">
                  <div className="quest-card-header">
                    <label className="check-row quest-check-row">
                      <input
                        checked={quest.done}
                        onChange={() => toggleQuest(quest.id, setSideQuests)}
                        type="checkbox"
                      />
                      <div className="task-copy">
                        <strong>{quest.title}</strong>
                        <small>
                          {quest.difficulty} · {completion.progressLabel}
                        </small>
                      </div>
                    </label>
                    <span className="side-quest-xp">+{quest.xp} XP</span>
                  </div>

                  <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                    {quest.objectives.map((objective) => (
                      <li key={objective.id}>
                        <label className="objective-check">
                          <input
                            checked={objective.done}
                            onChange={() =>
                              toggleObjective(quest.id, objective.id, setSideQuests)
                            }
                            type="checkbox"
                          />
                          <span>{objective.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className="quest-card-footer">
                    <p className="reward-pill">Reward: {quest.reward}</p>
                    <button
                      aria-label={`Delete ${quest.title}`}
                      className="ghost-button danger-button"
                      onClick={() => deleteQuest(quest.id, setSideQuests)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <form className="quest-form" onSubmit={addSideQuest}>
          <h3>Add Side Quest</h3>
          <input
            onChange={(event) => setSideTitle(event.target.value)}
            placeholder="Quest title"
            value={sideTitle}
          />
          <div className="form-grid">
            <input
              min="0"
              onChange={(event) => setSideXp(event.target.value)}
              placeholder="XP reward"
              type="number"
              value={sideXp}
            />
            <input
              onChange={(event) => setSideDifficulty(event.target.value)}
              placeholder="Difficulty"
              value={sideDifficulty}
            />
          </div>
          <input
            onChange={(event) => setSideReward(event.target.value)}
            placeholder="Reward"
            value={sideReward}
          />
          <textarea
            onChange={(event) => setSideObjectives(event.target.value)}
            placeholder={'One sub quest per line\nExample: Buy groceries'}
            rows={4}
            value={sideObjectives}
          />
          <button className="primary-button form-button" type="submit">
            Add Side Quest
          </button>
        </form>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Main Quests</h2>
          <span>Keep momentum</span>
        </div>

        <div className="card-stack">
          {mainQuests.map((quest) => {
            const completion = getQuestCompletion(quest);

            return (
              <article className={`goal-card ${quest.done ? 'is-complete' : ''}`} key={quest.id}>
                <div className="quest-card-copy">
                  <div className="quest-card-header">
                    <label className="check-row quest-check-row">
                      <input
                        checked={quest.done}
                        onChange={() => toggleQuest(quest.id, setMainQuests)}
                        type="checkbox"
                      />
                      <div>
                        <strong>{quest.title}</strong>
                        <small>{completion.progressLabel}</small>
                      </div>
                    </label>
                  </div>

                  <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                    {quest.objectives.map((objective) => (
                      <li key={objective.id}>
                        <label className="objective-check">
                          <input
                            checked={objective.done}
                            onChange={() =>
                              toggleObjective(quest.id, objective.id, setMainQuests)
                            }
                            type="checkbox"
                          />
                          <span>{objective.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className="quest-card-footer">
                    <p className="reward-pill">Reward: {quest.reward}</p>
                    <button
                      aria-label={`Delete ${quest.title}`}
                      className="ghost-button danger-button"
                      onClick={() => deleteQuest(quest.id, setMainQuests)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <form className="quest-form" onSubmit={addMainQuest}>
          <h3>Add Main Quest</h3>
          <input
            onChange={(event) => setMainTitle(event.target.value)}
            placeholder="Main quest title"
            value={mainTitle}
          />
          <input
            onChange={(event) => setMainReward(event.target.value)}
            placeholder="Reward"
            value={mainReward}
          />
          <textarea
            onChange={(event) => setMainObjectives(event.target.value)}
            placeholder={'One sub quest per line\nExample: Finish onboarding flow'}
            rows={4}
            value={mainObjectives}
          />
          <button className="primary-button form-button" type="submit">
            Add Main Quest
          </button>
        </form>
      </section>

      <section className="install-tip" aria-label="Install instructions">
        <p>On iPhone: open this site in Safari, tap Share, then Add to Home Screen.</p>
      </section>
    </main>
  );
}
