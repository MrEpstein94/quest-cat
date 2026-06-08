import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';

type DailyQuest = {
  id: string;
  title: string;
  xp: number;
  targetCount: number;
  progressCount: number;
  cardPower: number;
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

type BoardSelection =
  | { kind: 'daily-battle' }
  | { kind: 'side'; questId: string }
  | { kind: 'main'; questId: string };

type AppState = {
  dailyQuests: DailyQuest[];
  sideQuests: Quest[];
  mainQuests: Quest[];
};

type DailyBattleCard = {
  id: string;
  questId: string;
  title: string;
  cardPower: number;
  played: boolean;
};

const STORAGE_KEY = 'quest-cat-state-v3';

const rankTitles = [
  'Tiny Paws',
  'Alley Scout',
  'Whisker Squire',
  'Moonlight Hunter',
  'Legend Cat',
];

const baseXp = 180;

const defaultDailyQuests: DailyQuest[] = [
  { id: 'daily-1', title: 'Drink water', xp: 10, targetCount: 5, progressCount: 2, cardPower: 3 },
  { id: 'daily-2', title: 'Shower', xp: 15, targetCount: 1, progressCount: 0, cardPower: 8 },
  { id: 'daily-3', title: 'Brush teeth', xp: 12, targetCount: 2, progressCount: 1, cardPower: 4 },
  { id: 'daily-4', title: '30 minute workout', xp: 35, targetCount: 1, progressCount: 0, cardPower: 12 },
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

function clampCount(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isDailyQuestComplete(quest: DailyQuest) {
  return quest.progressCount >= quest.targetCount;
}

function getDailyProgressLabel(quest: DailyQuest) {
  return `${quest.progressCount} / ${quest.targetCount} cards played`;
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

function buildInitialState(): AppState {
  return {
    dailyQuests: defaultDailyQuests,
    sideQuests: defaultSideQuests,
    mainQuests: defaultMainQuests,
  };
}

function normalizeDailyQuest(
  quest: Partial<DailyQuest> & { id?: string; title?: string; xp?: number; done?: boolean },
) {
  const targetCount = Math.max(1, Number(quest.targetCount ?? 1));
  const fallbackProgress = quest.done ? targetCount : 0;
  const progressCount = clampCount(
    Number(quest.progressCount ?? fallbackProgress),
    0,
    targetCount,
  );

  return {
    id: quest.id ?? createId('daily'),
    title: quest.title ?? 'New daily routine',
    xp: Number(quest.xp ?? 10),
    targetCount,
    progressCount,
    cardPower: Math.max(1, Number(quest.cardPower ?? quest.xp ?? 3)),
  };
}

function normalizeObjective(objective: Partial<Objective>) {
  return {
    id: objective.id ?? createId('objective'),
    title: objective.title ?? 'New step',
    done: Boolean(objective.done),
  };
}

function normalizeQuest(quest: Partial<Quest>) {
  const objectives = Array.isArray(quest.objectives)
    ? quest.objectives.map(normalizeObjective)
    : [];
  const done =
    objectives.length > 0 ? objectives.every((objective) => objective.done) : Boolean(quest.done);

  return {
    id: quest.id ?? createId('quest'),
    title: quest.title ?? 'New quest',
    xp: quest.xp,
    difficulty: quest.difficulty,
    reward: quest.reward ?? 'Mystery reward',
    done,
    objectives,
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return buildInitialState();
  }

  const savedState =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem('quest-cat-state-v2') ??
    window.localStorage.getItem('quest-cat-state-v1');

  if (!savedState) {
    return buildInitialState();
  }

  try {
    const parsedState = JSON.parse(savedState) as Partial<AppState>;

    return {
      dailyQuests: Array.isArray(parsedState.dailyQuests)
        ? parsedState.dailyQuests.map((quest) => normalizeDailyQuest(quest))
        : defaultDailyQuests,
      sideQuests: Array.isArray(parsedState.sideQuests)
        ? parsedState.sideQuests.map((quest) => normalizeQuest(quest))
        : defaultSideQuests,
      mainQuests: Array.isArray(parsedState.mainQuests)
        ? parsedState.mainQuests.map((quest) => normalizeQuest(quest))
        : defaultMainQuests,
    };
  } catch {
    return buildInitialState();
  }
}

function buildDailyBattleCards(quests: DailyQuest[]) {
  return quests.flatMap<DailyBattleCard>((quest) =>
    Array.from({ length: quest.targetCount }, (_, index) => ({
      id: `${quest.id}-card-${index + 1}`,
      questId: quest.id,
      title: quest.title,
      cardPower: quest.cardPower,
      played: index < quest.progressCount,
    })),
  );
}

function DailyBattleBoard({
  cards,
  monsterHp,
  monsterMaxHp,
  monsterName,
  onBack,
  onPlayCard,
  onRecallCard,
  onResetBattle,
}: {
  cards: DailyBattleCard[];
  monsterHp: number;
  monsterMaxHp: number;
  monsterName: string;
  onBack: () => void;
  onPlayCard: (cardId: string) => void;
  onRecallCard: (cardId: string) => void;
  onResetBattle: () => void;
}) {
  const handCards = cards.filter((card) => !card.played);
  const playedCards = cards.filter((card) => card.played);
  const monsterDefeated = monsterHp <= 0;
  const damageDealt = monsterMaxHp - monsterHp;
  const healthPercent =
    monsterMaxHp === 0 ? 100 : Math.max(0, Math.round((monsterHp / monsterMaxHp) * 100));

  return (
    <main className="shell board-shell">
      <section className="hero-card board-hero">
        <button className="ghost-button back-button" onClick={onBack} type="button">
          Back to Quests
        </button>
        <p className="eyebrow">ROGUELIKE DAILY BATTLE</p>
        <h1>Card Battle</h1>
        <p className="hero-copy">
          Play your routine cards from your hand. Each card hits the monster for its own damage.
        </p>
      </section>

      <section className="monster-card monster-arena" aria-label="Monster arena">
        <div className="monster-header">
          <div>
            <span className="monster-label">Monster</span>
            <strong>{monsterName}</strong>
          </div>
          <span className={`monster-status ${monsterDefeated ? 'is-victory' : ''}`}>
            {monsterDefeated ? 'Defeated' : `${monsterHp} HP left`}
          </span>
        </div>

        <div className="monster-boss-art" aria-hidden="true">
          {monsterDefeated ? '💥' : '👾'}
        </div>

        <div className="monster-bar" aria-hidden="true">
          <span style={{ width: `${healthPercent}%` }} />
        </div>

        <div className="battle-stats">
          <span>{damageDealt} damage dealt</span>
          <span>{playedCards.length} cards played</span>
        </div>

        <button className="ghost-button reset-button" onClick={onResetBattle} type="button">
          Reset Battle
        </button>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Hand</h2>
          <span>{handCards.length} cards left</span>
        </div>
        <div className="card-grid">
          {handCards.length === 0 ? (
            <article className="battle-empty">
              <strong>No cards left in hand</strong>
              <span>Play more routines tomorrow or reset this battle.</span>
            </article>
          ) : (
            handCards.map((card) => (
              <button
                className="battle-card"
                key={card.id}
                onClick={() => onPlayCard(card.id)}
                type="button"
              >
                <span className="battle-card-type">Routine Card</span>
                <strong>{card.title}</strong>
                <small>{card.cardPower} damage</small>
                <span className="battle-card-action">Play Card</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Played Cards</h2>
          <span>{playedCards.length} on the board</span>
        </div>
        <div className="card-grid">
          {playedCards.length === 0 ? (
            <article className="battle-empty">
              <strong>No cards placed yet</strong>
              <span>Tap a card from your hand to attack the monster.</span>
            </article>
          ) : (
            playedCards.map((card) => (
              <button
                className="battle-card is-played"
                key={card.id}
                onClick={() => onRecallCard(card.id)}
                type="button"
              >
                <span className="battle-card-type">Played</span>
                <strong>{card.title}</strong>
                <small>{card.cardPower} damage dealt</small>
                <span className="battle-card-action">Recall Card</span>
              </button>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function QuestTrackBoard({
  onBack,
  onStepToggle,
  selection,
  title,
  subtitle,
  steps,
}: {
  onBack: () => void;
  onStepToggle: (stepIndex: number) => void;
  selection: BoardSelection;
  title: string;
  subtitle: string;
  steps: { id: string; title: string; done: boolean }[];
}) {
  const completedSteps = steps.filter((step) => step.done).length;
  const avatarIndex = steps.length === 0 ? 0 : Math.min(completedSteps, steps.length - 1);

  return (
    <main className="shell board-shell">
      <section className="hero-card board-hero">
        <button className="ghost-button back-button" onClick={onBack} type="button">
          Back to Quests
        </button>
        <p className="eyebrow">
          {selection.kind === 'side' ? 'SIDE QUEST TRACK' : 'MAIN QUEST TRACK'}
        </p>
        <h1>{title}</h1>
        <p className="hero-copy">{subtitle}</p>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Quest Board</h2>
          <span>
            {completedSteps} of {steps.length} spaces cleared
          </span>
        </div>

        <div className="board-track" aria-label={`${title} game board`}>
          {steps.map((step, index) => {
            const isAvatarHere = avatarIndex === index;

            return (
              <button
                className={`board-space ${step.done ? 'is-complete' : ''} ${isAvatarHere ? 'has-avatar' : ''}`}
                key={step.id}
                onClick={() => onStepToggle(index)}
                type="button"
              >
                <span className="board-step-number">Space {index + 1}</span>
                <strong>{step.title}</strong>
                <small>{step.done ? 'Complete' : 'Tap to complete'}</small>
                {isAvatarHere ? <span className="board-avatar" aria-hidden="true">🐾</span> : null}
              </button>
            );
          })}
          <div className="board-finish">
            <span>Finish</span>
            <strong>Reward Chest</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [initialState] = useState(loadInitialState);
  const [dailyQuests, setDailyQuests] = useState(initialState.dailyQuests);
  const [sideQuests, setSideQuests] = useState(initialState.sideQuests);
  const [mainQuests, setMainQuests] = useState(initialState.mainQuests);
  const [selectedBoard, setSelectedBoard] = useState<BoardSelection | null>(null);

  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyXp, setDailyXp] = useState('10');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [dailyPower, setDailyPower] = useState('3');

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

  const completedCount = dailyQuests.filter((quest) => isDailyQuestComplete(quest)).length;
  const earnedXp = dailyQuests
    .filter((quest) => isDailyQuestComplete(quest))
    .reduce((total, quest) => total + quest.xp, 0);
  const sideQuestXp = sideQuests.reduce((total, quest) => total + (quest.xp ?? 0), 0);
  const totalXp = baseXp + earnedXp;
  const rankProgress = getRankProgress(totalXp);

  const battleCards = useMemo(() => buildDailyBattleCards(dailyQuests), [dailyQuests]);
  const totalMonsterHp = dailyQuests.reduce(
    (total, quest) => total + quest.targetCount * quest.cardPower,
    0,
  );
  const currentMonsterHp = Math.max(
    0,
    totalMonsterHp -
      dailyQuests.reduce((total, quest) => total + quest.progressCount * quest.cardPower, 0),
  );

  const questBoardDetails = useMemo(() => {
    if (!selectedBoard || selectedBoard.kind === 'daily-battle') {
      return null;
    }

    const questList = selectedBoard.kind === 'side' ? sideQuests : mainQuests;
    const quest = questList.find((item) => item.id === selectedBoard.questId);

    if (!quest) {
      return null;
    }

    return {
      title: quest.title,
      subtitle: quest.reward,
      steps: quest.objectives.map((objective) => ({
        id: objective.id,
        title: objective.title,
        done: objective.done,
      })),
    };
  }, [mainQuests, selectedBoard, sideQuests]);

  function addDailyQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = dailyTitle.trim();
    const xp = Number(dailyXp);
    const targetCount = Number(dailyTarget);
    const cardPower = Number(dailyPower);

    if (
      !title ||
      Number.isNaN(xp) ||
      xp < 0 ||
      Number.isNaN(targetCount) ||
      targetCount < 1 ||
      Number.isNaN(cardPower) ||
      cardPower < 1
    ) {
      return;
    }

    setDailyQuests((current) => [
      ...current,
      {
        id: createId('daily'),
        title,
        xp,
        targetCount,
        progressCount: 0,
        cardPower,
      },
    ]);
    setDailyTitle('');
    setDailyXp('10');
    setDailyTarget('1');
    setDailyPower('3');
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

  function playDailyCard(cardId: string) {
    setDailyQuests((current) =>
      current.map((quest) => {
        const playableCardIndex = current
          .filter((item) => item.id === quest.id)
          .flatMap((item) =>
            Array.from({ length: item.targetCount }, (_, index) => `${item.id}-card-${index + 1}`),
          )
          .findIndex((id) => id === cardId);

        if (!cardId.startsWith(`${quest.id}-card-`) || playableCardIndex === -1) {
          return quest;
        }

        return {
          ...quest,
          progressCount: clampCount(quest.progressCount + 1, 0, quest.targetCount),
        };
      }),
    );
  }

  function recallDailyCard(cardId: string) {
    setDailyQuests((current) =>
      current.map((quest) => {
        if (!cardId.startsWith(`${quest.id}-card-`)) {
          return quest;
        }

        return {
          ...quest,
          progressCount: clampCount(quest.progressCount - 1, 0, quest.targetCount),
        };
      }),
    );
  }

  function setDailyQuestProgress(questId: string, progressCount: number) {
    setDailyQuests((current) =>
      current.map((quest) =>
        quest.id === questId
          ? {
              ...quest,
              progressCount: clampCount(progressCount, 0, quest.targetCount),
            }
          : quest,
      ),
    );
  }

  function resetDailyBattle() {
    setDailyQuests((current) =>
      current.map((quest) => ({
        ...quest,
        progressCount: 0,
      })),
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

  function deleteQuest(
    questId: string,
    kind: 'side' | 'main',
    setter: Dispatch<SetStateAction<Quest[]>>,
  ) {
    setter((current) => current.filter((quest) => quest.id !== questId));
    setSelectedBoard((current) =>
      current?.kind === kind && current.questId === questId ? null : current,
    );
  }

  function toggleQuestBoardStep(stepIndex: number) {
    if (!selectedBoard || selectedBoard.kind === 'daily-battle') {
      return;
    }

    const setter = selectedBoard.kind === 'side' ? setSideQuests : setMainQuests;
    setter((current) =>
      current.map((quest) => {
        if (quest.id !== selectedBoard.questId) {
          return quest;
        }

        const objectives = quest.objectives.map((objective, index) => ({
          ...objective,
          done: index <= stepIndex,
        }));

        return {
          ...quest,
          objectives,
          done: objectives.every((objective) => objective.done),
        };
      }),
    );
  }

  if (selectedBoard?.kind === 'daily-battle') {
    return (
      <DailyBattleBoard
        cards={battleCards}
        monsterHp={currentMonsterHp}
        monsterMaxHp={Math.max(totalMonsterHp, 1)}
        monsterName={currentMonsterHp <= 0 ? 'Hydra of Habits Defeated' : 'Hydra of Habits'}
        onBack={() => setSelectedBoard(null)}
        onPlayCard={playDailyCard}
        onRecallCard={recallDailyCard}
        onResetBattle={resetDailyBattle}
      />
    );
  }

  if (selectedBoard && questBoardDetails) {
    return (
      <QuestTrackBoard
        onBack={() => setSelectedBoard(null)}
        onStepToggle={toggleQuestBoardStep}
        selection={selectedBoard}
        steps={questBoardDetails.steps}
        subtitle={questBoardDetails.subtitle}
        title={questBoardDetails.title}
      />
    );
  }

  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">TODAY&apos;S ADVENTURE</p>
        <h1>Quest Cat</h1>
        <p className="hero-copy">
          Turn your routines into playable cards, slam them onto the battlefield, and beat the
          monster by actually playing your day like an RPG.
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
            The daily battle uses your routine cards. Side quests and main quests still open as
            board tracks.
          </p>
        </section>

        <button
          className="primary-button hero-action"
          onClick={() => setSelectedBoard({ kind: 'daily-battle' })}
          type="button"
        >
          Open Daily Card Battle
        </button>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Daily Routine Cards</h2>
          <span>
            {completedCount} of {dailyQuests.length} decks cleared
          </span>
        </div>

        <div className="card-stack">
          {dailyQuests.map((quest) => (
            <article
              className={`task-card ${isDailyQuestComplete(quest) ? 'is-complete' : ''}`}
              key={quest.id}
            >
              <div className="quest-content">
                <div className="task-copy">
                  <strong>{quest.title}</strong>
                  <small>
                    {quest.targetCount} cards · {quest.cardPower} damage each · {getDailyProgressLabel(quest)}
                  </small>
                </div>

                <div className="mini-stepper" aria-label={`${quest.title} progress`}>
                  <button
                    className="ghost-button"
                    onClick={() => setDailyQuestProgress(quest.id, quest.progressCount - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span>{quest.progressCount}</span>
                  <button
                    className="ghost-button"
                    onClick={() => setDailyQuestProgress(quest.id, quest.progressCount + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="ghost-button"
                  onClick={() => setSelectedBoard({ kind: 'daily-battle' })}
                  type="button"
                >
                  Open Battle
                </button>
                <button
                  aria-label={`Delete ${quest.title}`}
                  className="ghost-button danger-button"
                  onClick={() => deleteDailyQuest(quest.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        <form className="quest-form" onSubmit={addDailyQuest}>
          <h3>Add Daily Card Deck</h3>
          <input
            onChange={(event) => setDailyTitle(event.target.value)}
            placeholder="Routine title"
            value={dailyTitle}
          />
          <div className="form-grid">
            <input
              min="0"
              onChange={(event) => setDailyXp(event.target.value)}
              placeholder="XP reward"
              type="number"
              value={dailyXp}
            />
            <input
              min="1"
              onChange={(event) => setDailyTarget(event.target.value)}
              placeholder="Number of cards"
              type="number"
              value={dailyTarget}
            />
          </div>
          <input
            min="1"
            onChange={(event) => setDailyPower(event.target.value)}
            placeholder="Damage per card"
            type="number"
            value={dailyPower}
          />
          <button className="primary-button form-button" type="submit">
            Add Daily Card Deck
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
              <article
                className={`goal-card side-quest-card ${quest.done ? 'is-complete' : ''}`}
                key={quest.id}
              >
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
                    <div className="card-actions">
                      <button
                        className="ghost-button"
                        onClick={() => setSelectedBoard({ kind: 'side', questId: quest.id })}
                        type="button"
                      >
                        Open Board
                      </button>
                      <button
                        aria-label={`Delete ${quest.title}`}
                        className="ghost-button danger-button"
                        onClick={() => deleteQuest(quest.id, 'side', setSideQuests)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
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
                    <div className="card-actions">
                      <button
                        className="ghost-button"
                        onClick={() => setSelectedBoard({ kind: 'main', questId: quest.id })}
                        type="button"
                      >
                        Open Board
                      </button>
                      <button
                        aria-label={`Delete ${quest.title}`}
                        className="ghost-button danger-button"
                        onClick={() => deleteQuest(quest.id, 'main', setMainQuests)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
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
