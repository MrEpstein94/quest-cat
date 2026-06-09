import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type FormEvent, type SetStateAction } from 'react';

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
  cardPower: number;
  done: boolean;
};

type Quest = {
  id: string;
  title: string;
  xp?: number;
  difficulty?: string;
  monsterName?: string;
  reward: string;
  done: boolean;
  objectives: Objective[];
};

type BoardSelection =
  | { kind: 'daily' }
  | { kind: 'side'; questId: string }
  | { kind: 'main'; questId: string };

type AppState = {
  dailyQuests: DailyQuest[];
  sideQuests: Quest[];
  mainQuests: Quest[];
};

type BattleCard = {
  id: string;
  originId: string;
  title: string;
  cardPower: number;
  played: boolean;
  flavor: string;
  family: 'daily' | 'side' | 'main';
};

type BattleState = {
  title: string;
  subtitle: string;
  monsterName: string;
  monsterMood: string;
  totalHp: number;
  currentHp: number;
  cards: BattleCard[];
};

const STORAGE_KEY = 'quest-cat-state-v4';

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
      { id: 'side-1-1', title: 'Pick one person', cardPower: 4, done: false },
      { id: 'side-1-2', title: 'Send the message', cardPower: 5, done: false },
      { id: 'side-1-3', title: 'Archive the thread', cardPower: 6, done: false },
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
      { id: 'side-2-1', title: 'Choose one desk or counter', cardPower: 4, done: false },
      { id: 'side-2-2', title: 'Throw away trash', cardPower: 5, done: false },
      { id: 'side-2-3', title: 'Put items back', cardPower: 6, done: false },
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
      { id: 'side-3-1', title: 'Set a 15-minute timer', cardPower: 6, done: false },
      { id: 'side-3-2', title: 'Read without phone', cardPower: 7, done: false },
      { id: 'side-3-3', title: 'Log one takeaway', cardPower: 8, done: false },
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
      { id: 'main-1-1', title: 'Finish 3 daily quests each day', cardPower: 8, done: false },
      { id: 'main-1-2', title: 'Keep the streak alive tonight', cardPower: 10, done: false },
    ],
  },
  {
    id: 'main-2',
    title: 'Launch Quest Cat v1',
    reward: 'Buy a custom cat icon pack',
    done: false,
    objectives: [
      { id: 'main-2-1', title: 'Finish quest list layout', cardPower: 8, done: false },
      { id: 'main-2-2', title: 'Define reward system', cardPower: 9, done: false },
      { id: 'main-2-3', title: 'Ship first installable build', cardPower: 11, done: false },
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

function getQuestCompletion(quest: Quest) {
  const objectiveCount = quest.objectives.length;
  const completedObjectives = quest.objectives.filter((objective) => objective.done).length;

  return {
    completedObjectives,
    objectiveCount,
    progressLabel:
      objectiveCount === 0 ? 'No sub quests yet' : `${completedObjectives} / ${objectiveCount} cards played`,
  };
}

function slugWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function titleize(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function autoGenerateMonsterName(kind: 'side' | 'main', title: string) {
  const words = slugWords(title);
  const anchor = words[0] ?? 'quest';
  const tail = words[words.length - 1] ?? 'trial';
  const sideTemplates = [
    `The ${titleize(anchor)} Bandit`,
    `${titleize(anchor)} Warden`,
    `The ${titleize(tail)} Shade`,
  ];
  const mainTemplates = [
    `${titleize(anchor)} Sovereign`,
    `The ${titleize(tail)} Titan`,
    `${titleize(anchor)} Overlord`,
  ];
  const templates = kind === 'side' ? sideTemplates : mainTemplates;
  const hash = words.join('').length % templates.length;

  return templates[hash];
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
  const progressCount = clampCount(Number(quest.progressCount ?? fallbackProgress), 0, targetCount);

  return {
    id: quest.id ?? createId('daily'),
    title: quest.title ?? 'New daily routine',
    xp: Number(quest.xp ?? 10),
    targetCount,
    progressCount,
    cardPower: Math.max(1, Number(quest.cardPower ?? 3)),
  };
}

function normalizeObjective(objective: Partial<Objective>) {
  return {
    id: objective.id ?? createId('objective'),
    title: objective.title ?? 'New step',
    cardPower: Math.max(1, Number(objective.cardPower ?? 4)),
    done: Boolean(objective.done),
  };
}

function parseObjectiveLine(line: string, fallbackPower: number) {
  const [rawTitle, rawPower] = line.split('|').map((part) => part.trim());
  const title = rawTitle || line.trim();
  const parsedPower = Number(rawPower?.replace(/[^0-9.-]/g, ''));

  return {
    title,
    cardPower: Number.isFinite(parsedPower) && parsedPower > 0 ? parsedPower : fallbackPower,
  };
}

function normalizeQuest(quest: Partial<Quest>) {
  const objectives = Array.isArray(quest.objectives)
    ? quest.objectives.map(normalizeObjective)
    : [];
  const done = objectives.length > 0 ? objectives.every((objective) => objective.done) : Boolean(quest.done);

  return {
    id: quest.id ?? createId('quest'),
    title: quest.title ?? 'New quest',
    xp: quest.xp,
    difficulty: quest.difficulty,
    monsterName: quest.monsterName?.trim() || undefined,
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
    window.localStorage.getItem('quest-cat-state-v3') ??
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

function buildBattleState(
  selection: BoardSelection,
  dailyQuests: DailyQuest[],
  sideQuests: Quest[],
  mainQuests: Quest[],
): BattleState | null {
  if (selection.kind === 'daily') {
    const cards = dailyQuests.flatMap<BattleCard>((quest) =>
      Array.from({ length: quest.targetCount }, (_, index) => ({
        id: `${quest.id}-card-${index + 1}`,
        originId: quest.id,
        title: quest.title,
        cardPower: quest.cardPower,
        played: index < quest.progressCount,
        flavor: `${quest.cardPower} damage splash`,
        family: 'daily',
      })),
    );
    const totalHp = cards.reduce((total, card) => total + card.cardPower, 0);
    const currentHp = Math.max(
      0,
      totalHp - cards.filter((card) => card.played).reduce((total, card) => total + card.cardPower, 0),
    );

    return {
      title: 'Daily Card Battle',
      subtitle: 'Play your routine cards from hand onto the battlefield to chip down the monster.',
      monsterName: currentHp === 0 ? 'Hydra of Habits Defeated' : 'Hydra of Habits',
      monsterMood: currentHp === 0 ? 'Collapsed under your routine combo.' : 'Still feeding on skipped habits.',
      totalHp: Math.max(totalHp, 1),
      currentHp,
      cards,
    };
  }

  const questList = selection.kind === 'side' ? sideQuests : mainQuests;
  const quest = questList.find((item) => item.id === selection.questId);

  if (!quest) {
    return null;
  }

  const cards = quest.objectives.map<BattleCard>((objective) => ({
    id: objective.id,
    originId: objective.id,
    title: objective.title,
    cardPower: objective.cardPower,
    played: objective.done,
    flavor: selection.kind === 'side' ? 'Tactical side-quest move' : 'Storyline power move',
    family: selection.kind,
  }));
  const totalHp = cards.reduce((total, card) => total + card.cardPower, 0);
  const currentHp = Math.max(
    0,
    totalHp - cards.filter((card) => card.played).reduce((total, card) => total + card.cardPower, 0),
  );
  const monsterName = quest.monsterName || autoGenerateMonsterName(selection.kind, quest.title);

  return {
    title: quest.title,
    subtitle: quest.reward,
    monsterName,
    monsterMood: selection.kind === 'side' ? 'A quick skirmish with bonus loot.' : 'A larger boss battle with story stakes.',
    totalHp: Math.max(totalHp, 1),
    currentHp,
    cards,
  };
}

function BattleBoard({
  battleState,
  hitCount,
  lastPlayedId,
  onBack,
  onPlayCard,
  onRecallCard,
  onResetBattle,
}: {
  battleState: BattleState;
  hitCount: number;
  lastPlayedId: string | null;
  onBack: () => void;
  onPlayCard: (cardId: string) => void;
  onRecallCard: (cardId: string) => void;
  onResetBattle: () => void;
}) {
  const handCards = battleState.cards.filter((card) => !card.played);
  const fieldCards = battleState.cards.filter((card) => card.played);
  const monsterDefeated = battleState.currentHp <= 0;
  const healthPercent = Math.max(
    0,
    Math.round((battleState.currentHp / battleState.totalHp) * 100),
  );

  return (
    <main className="shell board-shell">
      <section className="hero-card board-hero">
        <button className="ghost-button back-button" onClick={onBack} type="button">
          Back to Quests
        </button>
        <p className="eyebrow">CARD BATTLE</p>
        <h1>{battleState.title}</h1>
        <p className="hero-copy">{battleState.subtitle}</p>
      </section>

      <section className={`battle-scene ${hitCount > 0 ? 'is-hit' : ''}`} aria-label="Battle scene">
        <div className="battle-atmosphere" aria-hidden="true" />

        <section className="monster-stage">
          <div className="monster-stage-topbar">
            <div>
              <span className="monster-label">Elite Encounter</span>
              <strong>{battleState.monsterName}</strong>
            </div>
            <span className={`monster-status ${monsterDefeated ? 'is-victory' : ''}`}>
              {monsterDefeated ? 'KO' : `${battleState.currentHp} HP`}
            </span>
          </div>

          <div className="monster-intent-row">
            <span className="intent-badge">
              {monsterDefeated ? 'Broken Intent' : `Intent: endure ${handCards.length} more plays`}
            </span>
            <span className="battle-stat-chip">{battleState.totalHp} max HP</span>
          </div>

          {monsterDefeated ? <p className="victory-reward">Reward unlocked: {battleState.subtitle}</p> : null}

          <article className="monster-boss-card" key={hitCount}>
            <div className="monster-boss-topline">
              <span className="battle-card-type">Boss</span>
            </div>
            <div className="monster-boss-art" aria-hidden="true">
              {monsterDefeated ? '💥' : '👹'}
            </div>
            <strong>{battleState.monsterName}</strong>
            <small>{battleState.monsterMood}</small>
          </article>

          <div className="monster-bar-wrap">
            <div className="monster-bar" aria-hidden="true">
              <span style={{ width: `${healthPercent}%` }} />
            </div>
            <div className="battle-stats">
              <span>{fieldCards.length} cards on field</span>
            </div>
          </div>
        </section>

        <section className="battlefield-lane">
          <div className="section-heading battle-heading">
            <h2>Played Cards</h2>
            <span>{fieldCards.length} cards striking the monster</span>
          </div>
          <div className="field-row">
            {fieldCards.length === 0 ? (
              <article className="battle-empty field-empty">
                <strong>No cards in play yet</strong>
                <span>Pick a card from your hand and it will leap forward into the attack lane.</span>
              </article>
            ) : (
              fieldCards.map((card, index) => (
                <button
                  className={`battle-card game-card is-played field-card ${lastPlayedId === card.id ? 'just-played' : ''}`}
                  key={card.id}
                  onClick={() => onRecallCard(card.id)}
                  style={{ '--field-index': index } as CSSProperties}
                  type="button"
                >
                  <div className="battle-card-topline">
                    <span className="battle-card-type">field card</span>
                  </div>
                  <div className="battle-card-art" aria-hidden="true">
                    ⚔️
                  </div>
                  <strong>{card.title}</strong>
                  <span className="battle-card-action">Recall to hand</span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="hand-dock">
          <div className="hand-hud">
            <div className="section-heading battle-heading">
              <h2>Your Hand</h2>
              <span>{handCards.length} cards waiting</span>
            </div>
            <button className="ghost-button reset-button" onClick={onResetBattle} type="button">
              Reset Battle
            </button>
          </div>
          <div className="hand-fan">
            {handCards.length === 0 ? (
              <article className="battle-empty hand-empty">
                <strong>No cards in hand</strong>
                <span>Everything playable is already on the battlefield.</span>
              </article>
            ) : (
              handCards.map((card, index) => (
                <button
                  className="battle-card game-card hand-card"
                  key={card.id}
                  onClick={() => onPlayCard(card.id)}
                  style={
                    {
                      '--card-index': index,
                      '--card-count': handCards.length,
                    } as CSSProperties
                  }
                  type="button"
                >
                  <div className="hand-card-inner">
                    <div className="battle-card-art hand-card-art" aria-hidden="true">
                      {card.family === 'daily' ? '💧' : card.family === 'side' ? '🗡️' : '👑'}
                    </div>
                    <div className="hand-card-copy">
                      <div className="battle-card-topline">
                        <span className="battle-card-type">{card.family} card</span>
                      </div>
                      <strong>{card.title}</strong>
                    </div>
                  </div>
                  <span className="battle-card-action">Play to field</span>
                </button>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [initialState] = useState(loadInitialState);
  const [dailyQuests, setDailyQuests] = useState(initialState.dailyQuests);
  const [sideQuests, setSideQuests] = useState(initialState.sideQuests);
  const [mainQuests, setMainQuests] = useState(initialState.mainQuests);
  const [builderMode, setBuilderMode] = useState<'daily' | 'side' | 'main' | null>('side');
  const [selectedBoard, setSelectedBoard] = useState<BoardSelection | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState(0);

  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyXp, setDailyXp] = useState('10');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [dailyPower, setDailyPower] = useState('3');

  const [sideTitle, setSideTitle] = useState('');
  const [sideXp, setSideXp] = useState('10');
  const [sideDifficulty, setSideDifficulty] = useState('');
  const [sideReward, setSideReward] = useState('');
  const [sideMonsterMode, setSideMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [sideMonsterName, setSideMonsterName] = useState('');
  const [sideObjectives, setSideObjectives] = useState('');

  const [mainTitle, setMainTitle] = useState('');
  const [mainReward, setMainReward] = useState('');
  const [mainMonsterMode, setMainMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [mainMonsterName, setMainMonsterName] = useState('');
  const [mainObjectives, setMainObjectives] = useState('');

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dailyQuests, sideQuests, mainQuests }),
    );
  }, [dailyQuests, sideQuests, mainQuests]);

  const completedCount = dailyQuests.filter((quest) => isDailyQuestComplete(quest)).length;
  const completedSideCount = sideQuests.filter((quest) => quest.done).length;
  const completedMainCount = mainQuests.filter((quest) => quest.done).length;
  const earnedXp = dailyQuests
    .filter((quest) => isDailyQuestComplete(quest))
    .reduce((total, quest) => total + quest.xp, 0);
  const sideQuestXp = sideQuests.reduce((total, quest) => total + (quest.xp ?? 0), 0);
  const totalXp = baseXp + earnedXp;
  const rankProgress = getRankProgress(totalXp);

  const activeBattle = useMemo(
    () =>
      selectedBoard
        ? buildBattleState(selectedBoard, dailyQuests, sideQuests, mainQuests)
        : null,
    [dailyQuests, mainQuests, selectedBoard, sideQuests],
  );

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
      .map((objective, index) => {
        const parsedObjective = parseObjectiveLine(objective, Math.max(4, Math.ceil((xp || 12) / 2) + index));

        return {
        id: createId('side-objective'),
        title: parsedObjective.title,
        cardPower: parsedObjective.cardPower,
        done: false,
        };
      });

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
        monsterName: sideMonsterMode === 'custom' ? sideMonsterName.trim() || undefined : undefined,
        reward,
        done: false,
        objectives,
      },
    ]);
    setSideTitle('');
    setSideXp('10');
    setSideDifficulty('');
    setSideReward('');
    setSideMonsterMode('auto');
    setSideMonsterName('');
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
      .map((objective, index) => {
        const parsedObjective = parseObjectiveLine(objective, 8 + index);

        return {
        id: createId('main-objective'),
        title: parsedObjective.title,
        cardPower: parsedObjective.cardPower,
        done: false,
        };
      });

    if (!title || !reward) {
      return;
    }

    setMainQuests((current) => [
      ...current,
      {
        id: createId('main'),
        title,
        monsterName: mainMonsterMode === 'custom' ? mainMonsterName.trim() || undefined : undefined,
        reward,
        done: false,
        objectives,
      },
    ]);
    setMainTitle('');
    setMainReward('');
    setMainMonsterMode('auto');
    setMainMonsterName('');
    setMainObjectives('');
  }

  function setDailyQuestProgress(questId: string, progressCount: number) {
    setDailyQuests((current) =>
      current.map((quest) =>
        quest.id === questId
          ? { ...quest, progressCount: clampCount(progressCount, 0, quest.targetCount) }
          : quest,
      ),
    );
  }

  function updateBattleFeedback(cardId: string | null) {
    setLastPlayedId(cardId);
    setHitCount((current) => current + 1);
  }

  function playBattleCard(cardId: string) {
    if (!selectedBoard) {
      return;
    }

    updateBattleFeedback(cardId);

    if (selectedBoard.kind === 'daily') {
      setDailyQuests((current) =>
        current.map((quest) =>
          cardId.startsWith(`${quest.id}-card-`)
            ? { ...quest, progressCount: clampCount(quest.progressCount + 1, 0, quest.targetCount) }
            : quest,
        ),
      );
      return;
    }

    const setter = selectedBoard.kind === 'side' ? setSideQuests : setMainQuests;
    setter((current) =>
      current.map((quest) =>
        quest.id === selectedBoard.questId
          ? {
              ...quest,
              objectives: quest.objectives.map((objective) =>
                objective.id === cardId ? { ...objective, done: true } : objective,
              ),
              done: quest.objectives.every((objective) =>
                objective.id === cardId ? true : objective.done,
              ),
            }
          : quest,
      ),
    );
  }

  function recallBattleCard(cardId: string) {
    if (!selectedBoard) {
      return;
    }

    setLastPlayedId(null);

    if (selectedBoard.kind === 'daily') {
      setDailyQuests((current) =>
        current.map((quest) =>
          cardId.startsWith(`${quest.id}-card-`)
            ? { ...quest, progressCount: clampCount(quest.progressCount - 1, 0, quest.targetCount) }
            : quest,
        ),
      );
      return;
    }

    const setter = selectedBoard.kind === 'side' ? setSideQuests : setMainQuests;
    setter((current) =>
      current.map((quest) => {
        if (quest.id !== selectedBoard.questId) {
          return quest;
        }

        const objectives = quest.objectives.map((objective) =>
          objective.id === cardId ? { ...objective, done: false } : objective,
        );

        return {
          ...quest,
          objectives,
          done: objectives.every((objective) => objective.done),
        };
      }),
    );
  }

  function resetBattle() {
    if (!selectedBoard) {
      return;
    }

    setLastPlayedId(null);
    setHitCount(0);

    if (selectedBoard.kind === 'daily') {
      setDailyQuests((current) => current.map((quest) => ({ ...quest, progressCount: 0 })));
      return;
    }

    const setter = selectedBoard.kind === 'side' ? setSideQuests : setMainQuests;
    setter((current) =>
      current.map((quest) =>
        quest.id === selectedBoard.questId
          ? {
              ...quest,
              done: false,
              objectives: quest.objectives.map((objective) => ({ ...objective, done: false })),
            }
          : quest,
      ),
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
              objectives: quest.objectives.map((objective) => ({ ...objective, done: !quest.done })),
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

        return {
          ...quest,
          objectives,
          done: objectives.every((objective) => objective.done),
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
      current && current.kind === kind && current.questId === questId ? null : current,
    );
  }

  if (selectedBoard && activeBattle) {
    return (
      <BattleBoard
        battleState={activeBattle}
        hitCount={hitCount}
        lastPlayedId={lastPlayedId}
        onBack={() => setSelectedBoard(null)}
        onPlayCard={playBattleCard}
        onRecallCard={recallBattleCard}
        onResetBattle={resetBattle}
      />
    );
  }

  return (
    <main className="shell">
      <section className="hero-card home-hero">
        <p className="eyebrow">QUEST MENU</p>
        <h1>Quest Cat</h1>
        <p className="hero-copy">
          Just Daily Quest, Side Quest, and Main Quest. Open a battle and track your progress.
        </p>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Forge a Quest</h2>
          <span>Build new quests, cards, monsters, and rewards</span>
        </div>

        <div className="builder-toggle-row">
          <button className={`ghost-button ${builderMode === 'daily' ? 'is-selected' : ''}`} onClick={() => setBuilderMode('daily')} type="button">
            Daily Deck
          </button>
          <button className={`ghost-button ${builderMode === 'side' ? 'is-selected' : ''}`} onClick={() => setBuilderMode('side')} type="button">
            Side Quest
          </button>
          <button className={`ghost-button ${builderMode === 'main' ? 'is-selected' : ''}`} onClick={() => setBuilderMode('main')} type="button">
            Main Quest
          </button>
        </div>

        {builderMode === 'daily' ? (
          <form className="quest-form" onSubmit={addDailyQuest}>
            <h3>Add Daily Card Deck</h3>
            <p className="form-note">Create a repeatable routine deck with however many cards you want to play each day.</p>
            <input onChange={(event) => setDailyTitle(event.target.value)} placeholder="Routine title" value={dailyTitle} />
            <div className="form-grid">
              <input min="0" onChange={(event) => setDailyXp(event.target.value)} placeholder="XP reward" type="number" value={dailyXp} />
              <input min="1" onChange={(event) => setDailyTarget(event.target.value)} placeholder="Number of cards" type="number" value={dailyTarget} />
            </div>
            <input min="1" onChange={(event) => setDailyPower(event.target.value)} placeholder="Damage per card" type="number" value={dailyPower} />
            <button className="primary-button form-button" type="submit">
              Add Daily Card Deck
            </button>
          </form>
        ) : null}

        {builderMode === 'side' ? (
          <form className="quest-form" onSubmit={addSideQuest}>
            <h3>Add Side Quest</h3>
            <p className="form-note">Give the quest a reward, add as many cards as you want, and choose whether the monster is custom or generated for you.</p>
            <input onChange={(event) => setSideTitle(event.target.value)} placeholder="Quest title" value={sideTitle} />
            <div className="form-grid">
              <input min="0" onChange={(event) => setSideXp(event.target.value)} placeholder="XP reward" type="number" value={sideXp} />
              <input onChange={(event) => setSideDifficulty(event.target.value)} placeholder="Difficulty" value={sideDifficulty} />
            </div>
            <input onChange={(event) => setSideReward(event.target.value)} placeholder="Reward for completion" value={sideReward} />
            <div className="monster-mode-row" role="group" aria-label="Monster naming">
              <button
                className={`ghost-button ${sideMonsterMode === 'auto' ? 'is-selected' : ''}`}
                onClick={() => setSideMonsterMode('auto')}
                type="button"
              >
                Auto-generate Monster
              </button>
              <button
                className={`ghost-button ${sideMonsterMode === 'custom' ? 'is-selected' : ''}`}
                onClick={() => setSideMonsterMode('custom')}
                type="button"
              >
                Name Monster Yourself
              </button>
            </div>
            {sideMonsterMode === 'custom' ? (
              <input onChange={(event) => setSideMonsterName(event.target.value)} placeholder="Monster name" value={sideMonsterName} />
            ) : (
              <p className="form-helper">Monster preview: {autoGenerateMonsterName('side', sideTitle || 'side quest')}</p>
            )}
            <textarea
              onChange={(event) => setSideObjectives(event.target.value)}
              placeholder={'One card per line\nUse "Card title | 8" for custom damage\nExample: Send the message | 6'}
              rows={5}
              value={sideObjectives}
            />
            <button className="primary-button form-button" type="submit">
              Add Side Quest
            </button>
          </form>
        ) : null}

        {builderMode === 'main' ? (
          <form className="quest-form" onSubmit={addMainQuest}>
            <h3>Add Main Quest</h3>
            <p className="form-note">Create a larger boss battle with a completion reward and a full hand of cards.</p>
            <input onChange={(event) => setMainTitle(event.target.value)} placeholder="Main quest title" value={mainTitle} />
            <input onChange={(event) => setMainReward(event.target.value)} placeholder="Reward for completion" value={mainReward} />
            <div className="monster-mode-row" role="group" aria-label="Main quest monster naming">
              <button
                className={`ghost-button ${mainMonsterMode === 'auto' ? 'is-selected' : ''}`}
                onClick={() => setMainMonsterMode('auto')}
                type="button"
              >
                Auto-generate Monster
              </button>
              <button
                className={`ghost-button ${mainMonsterMode === 'custom' ? 'is-selected' : ''}`}
                onClick={() => setMainMonsterMode('custom')}
                type="button"
              >
                Name Monster Yourself
              </button>
            </div>
            {mainMonsterMode === 'custom' ? (
              <input onChange={(event) => setMainMonsterName(event.target.value)} placeholder="Monster name" value={mainMonsterName} />
            ) : (
              <p className="form-helper">Monster preview: {autoGenerateMonsterName('main', mainTitle || 'main quest')}</p>
            )}
            <textarea
              onChange={(event) => setMainObjectives(event.target.value)}
              placeholder={'One card per line\nUse "Card title | 12" for custom damage\nExample: Ship first installable build | 14'}
              rows={5}
              value={mainObjectives}
            />
            <button className="primary-button form-button" type="submit">
              Add Main Quest
            </button>
          </form>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Daily Routine Decks</h2>
          <span>
            {completedCount} of {dailyQuests.length} decks cleared
          </span>
        </div>
        <div className="card-stack">
          {dailyQuests.map((quest) => (
            <article className="game-card list-card deck-card" key={quest.id}>
              <div className="battle-card-topline">
                <span className="battle-card-type">daily deck</span>
                <span className="battle-stat-chip">{quest.cardPower} dmg</span>
              </div>
              <div className="deck-card-body">
                <div className="deck-card-copy">
                  <strong>{quest.title}</strong>
                  <small className="deck-card-meta">
                    {quest.targetCount} cards
                    <span aria-hidden="true">·</span>
                    +{quest.xp} XP
                    <span aria-hidden="true">·</span>
                    {getDailyProgressLabel(quest)}
                  </small>
                </div>
              </div>
              <div className="mini-stepper" aria-label={`${quest.title} progress`}>
                <button className="ghost-button" onClick={() => setDailyQuestProgress(quest.id, quest.progressCount - 1)} type="button">
                  -
                </button>
                <span>{quest.progressCount}</span>
                <button className="ghost-button" onClick={() => setDailyQuestProgress(quest.id, quest.progressCount + 1)} type="button">
                  +
                </button>
              </div>
              <div className="card-actions">
                <button className="ghost-button" onClick={() => setSelectedBoard({ kind: 'daily' })} type="button">
                  Open Battle
                </button>
                <button className="ghost-button danger-button" onClick={() => deleteDailyQuest(quest.id)} type="button">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Side Quest Decks</h2>
          <span>Worth {sideQuestXp} bonus XP</span>
        </div>
        <div className="card-stack">
          {sideQuests.map((quest) => {
            const completion = getQuestCompletion(quest);

            return (
              <article className="game-card list-card deck-card" key={quest.id}>
                <div className="battle-card-topline">
                  <span className="battle-card-type">side deck</span>
                  <span className="battle-stat-chip">{quest.xp ?? 0} xp</span>
                </div>
                <div className="deck-card-body">
                  <div className="deck-card-copy">
                    <strong>{quest.title}</strong>
                    <small className="deck-card-meta">
                      {quest.difficulty} <span aria-hidden="true">·</span> {completion.progressLabel}
                    </small>
                    <p className="reward-pill">Reward: {quest.reward}</p>
                  </div>
                </div>
                <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                  {quest.objectives.map((objective) => (
                    <li key={objective.id}>
                      <label className="objective-check">
                        <input checked={objective.done} onChange={() => toggleObjective(quest.id, objective.id, setSideQuests)} type="checkbox" />
                        <span>
                          {objective.title}
                          <small className="objective-power">{objective.cardPower} dmg</small>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="card-actions">
                  <button className="ghost-button" onClick={() => setSelectedBoard({ kind: 'side', questId: quest.id })} type="button">
                    Open Battle
                  </button>
                  <button className="ghost-button danger-button" onClick={() => deleteQuest(quest.id, 'side', setSideQuests)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>

      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Main Quest Decks</h2>
          <span>Story battles</span>
        </div>
        <div className="card-stack">
          {mainQuests.map((quest) => {
            const completion = getQuestCompletion(quest);

            return (
              <article className="game-card list-card deck-card" key={quest.id}>
                <div className="battle-card-topline">
                  <span className="battle-card-type">main deck</span>
                  <span className="battle-stat-chip">{completion.objectiveCount} cards</span>
                </div>
                <div className="deck-card-body">
                  <div className="deck-card-copy">
                    <strong>{quest.title}</strong>
                    <small className="deck-card-meta">{completion.progressLabel}</small>
                    <p className="reward-pill">Reward: {quest.reward}</p>
                  </div>
                </div>
                <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                  {quest.objectives.map((objective) => (
                    <li key={objective.id}>
                      <label className="objective-check">
                        <input checked={objective.done} onChange={() => toggleObjective(quest.id, objective.id, setMainQuests)} type="checkbox" />
                        <span>
                          {objective.title}
                          <small className="objective-power">{objective.cardPower} dmg</small>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="card-actions">
                  <button className="ghost-button" onClick={() => setSelectedBoard({ kind: 'main', questId: quest.id })} type="button">
                    Open Battle
                  </button>
                  <button className="ghost-button danger-button" onClick={() => deleteQuest(quest.id, 'main', setMainQuests)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>

      </section>

      <section className="install-tip" aria-label="Install instructions">
        <p>On iPhone: open this site in Safari, tap Share, then Add to Home Screen.</p>
      </section>
    </main>
  );
}
