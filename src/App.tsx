import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type FormEvent, type SetStateAction } from 'react';

type Recurrence = 'none' | 'daily' | 'weekly';
type DeadlineType = 'none' | 'endOfDay' | 'endOfWeek' | 'custom';

type QuestHistoryEntry = {
  id: string;
  family: 'daily' | 'side' | 'main';
  questId: string;
  title: string;
  reward: string;
  completedAt: string;
};

type DailyQuest = {
  id: string;
  title: string;
  xp: number;
  targetCount: number;
  progressCount: number;
  cardPower: number;
  recurrence: Recurrence;
  deadlineType: DeadlineType;
  deadlineAt?: string;
  completedAt?: string;
};

type Objective = {
  id: string;
  title: string;
  cardPower: number;
  done: boolean;
};

type DraftCard = {
  id: string;
  title: string;
  cardPower: string;
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
  recurrence: Recurrence;
  deadlineType: DeadlineType;
  deadlineAt?: string;
  completedAt?: string;
};

type BoardSelection =
  | { kind: 'daily' }
  | { kind: 'side'; questId: string }
  | { kind: 'main'; questId: string };

type AppState = {
  dailyQuests: DailyQuest[];
  sideQuests: Quest[];
  mainQuests: Quest[];
  completionHistory: QuestHistoryEntry[];
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

const STORAGE_KEY = 'quest-cat-state-v6';

const rankTitles = [
  'Tiny Paws',
  'Alley Scout',
  'Whisker Squire',
  'Moonlight Hunter',
  'Legend Cat',
];

const baseXp = 180;

const recurrenceOptions: Array<{ value: Recurrence; label: string }> = [
  { value: 'none', label: 'No recurrence' },
  { value: 'daily', label: 'Repeats daily' },
  { value: 'weekly', label: 'Repeats weekly' },
];

const deadlineOptions: Array<{ value: DeadlineType; label: string }> = [
  { value: 'none', label: 'No time limit' },
  { value: 'endOfDay', label: 'End of day' },
  { value: 'endOfWeek', label: 'End of week' },
  { value: 'custom', label: 'Custom date' },
];

const defaultDailyQuests: DailyQuest[] = [
  { id: 'daily-1', title: 'Drink water', xp: 10, targetCount: 5, progressCount: 2, cardPower: 3, recurrence: 'daily', deadlineType: 'endOfDay' },
  { id: 'daily-2', title: 'Shower', xp: 15, targetCount: 1, progressCount: 0, cardPower: 8, recurrence: 'daily', deadlineType: 'endOfDay' },
  { id: 'daily-3', title: 'Brush teeth', xp: 12, targetCount: 2, progressCount: 1, cardPower: 4, recurrence: 'daily', deadlineType: 'endOfDay' },
  { id: 'daily-4', title: '30 minute workout', xp: 35, targetCount: 1, progressCount: 0, cardPower: 12, recurrence: 'daily', deadlineType: 'endOfDay' },
];

const defaultSideQuests: Quest[] = [
  {
    id: 'side-1',
    title: 'Reply to one lingering text',
    xp: 8,
    difficulty: 'Quick win',
    reward: '15 minutes guilt-free scrolling',
    done: false,
    recurrence: 'none',
    deadlineType: 'none',
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
    recurrence: 'none',
    deadlineType: 'none',
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
    recurrence: 'none',
    deadlineType: 'none',
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
    recurrence: 'weekly',
    deadlineType: 'endOfWeek',
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
    recurrence: 'none',
    deadlineType: 'none',
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

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
}

function getEndOfDay(date: Date) {
  const end = getStartOfDay(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function resolveDeadlineAt(deadlineType: DeadlineType, deadlineAt?: string, now = new Date()) {
  if (deadlineType === 'endOfDay') {
    return getEndOfDay(now).toISOString();
  }

  if (deadlineType === 'endOfWeek') {
    return getEndOfWeek(now).toISOString();
  }

  if (deadlineType === 'custom' && deadlineAt) {
    const customDate = new Date(deadlineAt);

    if (!Number.isNaN(customDate.getTime())) {
      return getEndOfDay(customDate).toISOString();
    }
  }

  return undefined;
}

function normalizeDeadlineAt(deadlineType: DeadlineType, deadlineAt?: string) {
  return deadlineType === 'custom' ? deadlineAt || undefined : undefined;
}

function formatDeadline(deadlineType: DeadlineType, deadlineAt?: string) {
  const resolvedDeadline = resolveDeadlineAt(deadlineType, deadlineAt);

  if (!resolvedDeadline) {
    return 'No time limit';
  }

  const date = new Date(resolvedDeadline);

  if (deadlineType === 'endOfDay') {
    return 'Due by end of day';
  }

  if (deadlineType === 'endOfWeek') {
    return 'Due by end of week';
  }

  return `Due ${date.toLocaleDateString()}`;
}

function formatRecurrence(recurrence: Recurrence) {
  if (recurrence === 'daily') {
    return 'Repeats daily';
  }

  if (recurrence === 'weekly') {
    return 'Repeats weekly';
  }

  return 'One-time quest';
}

function shouldResetRecurring(completedAt: string | undefined, recurrence: Recurrence, now = new Date()) {
  if (!completedAt || recurrence === 'none') {
    return false;
  }

  const completedDate = new Date(completedAt);

  if (Number.isNaN(completedDate.getTime())) {
    return false;
  }

  if (recurrence === 'daily') {
    return getStartOfDay(now).getTime() > getStartOfDay(completedDate).getTime();
  }

  if (recurrence === 'weekly') {
    return getStartOfWeek(now).getTime() > getStartOfWeek(completedDate).getTime();
  }

  return false;
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

function isQuestComplete(quest: Quest) {
  return quest.objectives.length > 0 && quest.objectives.every((objective) => objective.done);
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
    completionHistory: [],
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
    recurrence: quest.recurrence ?? 'daily',
    deadlineType: quest.deadlineType ?? 'endOfDay',
    deadlineAt: normalizeDeadlineAt(quest.deadlineType ?? 'endOfDay', quest.deadlineAt),
    completedAt: quest.completedAt,
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

function createDraftCard(defaultPower = '4'): DraftCard {
  return {
    id: createId('draft-card'),
    title: '',
    cardPower: defaultPower,
  };
}

function normalizeDraftCards(cards: DraftCard[], fallbackBasePower: number) {
  return cards
    .map((card, index) => ({
      title: card.title.trim(),
      cardPower: Number(card.cardPower),
      fallbackPower: fallbackBasePower + index,
    }))
    .filter((card) => card.title)
    .map((card) => ({
      id: createId('objective'),
      title: card.title,
      cardPower:
        Number.isFinite(card.cardPower) && card.cardPower > 0 ? card.cardPower : card.fallbackPower,
      done: false,
    }));
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
    recurrence: quest.recurrence ?? 'none',
    deadlineType: quest.deadlineType ?? 'none',
    deadlineAt: normalizeDeadlineAt(quest.deadlineType ?? 'none', quest.deadlineAt),
    completedAt: quest.completedAt,
  };
}

function normalizeHistoryEntry(entry: Partial<QuestHistoryEntry>) {
  return {
    id: entry.id ?? createId('history'),
    family: (entry.family as QuestHistoryEntry['family']) ?? 'side',
    questId: entry.questId ?? createId('quest-ref'),
    title: entry.title ?? 'Completed quest',
    reward: entry.reward ?? 'Reward claimed',
    completedAt: entry.completedAt ?? new Date().toISOString(),
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return buildInitialState();
  }

  const savedState =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem('quest-cat-state-v5') ??
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
      completionHistory: Array.isArray(parsedState.completionHistory)
        ? parsedState.completionHistory.map((entry) => normalizeHistoryEntry(entry))
        : [],
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
  const [completionHistory, setCompletionHistory] = useState(initialState.completionHistory);
  const [builderMode, setBuilderMode] = useState<'daily' | 'side' | 'main' | null>('side');
  const [selectedBoard, setSelectedBoard] = useState<BoardSelection | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState(0);

  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyXp, setDailyXp] = useState('10');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [dailyPower, setDailyPower] = useState('3');
  const [dailyRecurrence, setDailyRecurrence] = useState<Recurrence>('daily');
  const [dailyDeadlineType, setDailyDeadlineType] = useState<DeadlineType>('endOfDay');
  const [dailyDeadlineAt, setDailyDeadlineAt] = useState('');

  const [sideTitle, setSideTitle] = useState('');
  const [sideXp, setSideXp] = useState('10');
  const [sideDifficulty, setSideDifficulty] = useState('');
  const [sideReward, setSideReward] = useState('');
  const [sideMonsterMode, setSideMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [sideMonsterName, setSideMonsterName] = useState('');
  const [sideCards, setSideCards] = useState<DraftCard[]>([createDraftCard('6')]);
  const [sideRecurrence, setSideRecurrence] = useState<Recurrence>('none');
  const [sideDeadlineType, setSideDeadlineType] = useState<DeadlineType>('none');
  const [sideDeadlineAt, setSideDeadlineAt] = useState('');

  const [mainTitle, setMainTitle] = useState('');
  const [mainReward, setMainReward] = useState('');
  const [mainMonsterMode, setMainMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [mainMonsterName, setMainMonsterName] = useState('');
  const [mainCards, setMainCards] = useState<DraftCard[]>([createDraftCard('10')]);
  const [mainRecurrence, setMainRecurrence] = useState<Recurrence>('none');
  const [mainDeadlineType, setMainDeadlineType] = useState<DeadlineType>('none');
  const [mainDeadlineAt, setMainDeadlineAt] = useState('');

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dailyQuests, sideQuests, mainQuests, completionHistory }),
    );
  }, [completionHistory, dailyQuests, sideQuests, mainQuests]);

  useEffect(() => {
    function resetRecurringQuests() {
      const now = new Date();

      setDailyQuests((current) =>
        current.map((quest) =>
          shouldResetRecurring(quest.completedAt, quest.recurrence, now)
            ? { ...quest, progressCount: 0, completedAt: undefined }
            : quest,
        ),
      );

      const resetQuestCollection = (setter: Dispatch<SetStateAction<Quest[]>>) => {
        setter((current) =>
          current.map((quest) =>
            shouldResetRecurring(quest.completedAt, quest.recurrence, now)
              ? {
                  ...quest,
                  done: false,
                  completedAt: undefined,
                  objectives: quest.objectives.map((objective) => ({ ...objective, done: false })),
                }
              : quest,
          ),
        );
      };

      resetQuestCollection(setSideQuests);
      resetQuestCollection(setMainQuests);
    }

    resetRecurringQuests();
    const intervalId = window.setInterval(resetRecurringQuests, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const completedCount = dailyQuests.filter((quest) => isDailyQuestComplete(quest)).length;
  const completedSideCount = sideQuests.filter((quest) => quest.done).length;
  const completedMainCount = mainQuests.filter((quest) => quest.done).length;
  const earnedXp = dailyQuests
    .filter((quest) => isDailyQuestComplete(quest))
    .reduce((total, quest) => total + quest.xp, 0);
  const sideQuestXp = sideQuests.reduce((total, quest) => total + (quest.xp ?? 0), 0);
  const totalXp = baseXp + earnedXp;
  const rankProgress = getRankProgress(totalXp);
  const recentHistory = useMemo(
    () =>
      [...completionHistory].sort(
        (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
      ),
    [completionHistory],
  );

  const activeBattle = useMemo(
    () =>
      selectedBoard
        ? buildBattleState(selectedBoard, dailyQuests, sideQuests, mainQuests)
        : null,
    [dailyQuests, mainQuests, selectedBoard, sideQuests],
  );

  function logQuestCompletion(entry: Omit<QuestHistoryEntry, 'id' | 'completedAt'>, completedAt: string) {
    setCompletionHistory((current) => [
      {
        id: createId('history'),
        completedAt,
        ...entry,
      },
      ...current,
    ]);
  }

  function buildQuestHistoryEntry(
    family: QuestHistoryEntry['family'],
    quest: Pick<Quest, 'id' | 'title' | 'reward'>,
  ) {
    return {
      family,
      questId: quest.id,
      title: quest.title,
      reward: quest.reward,
    } satisfies Omit<QuestHistoryEntry, 'id' | 'completedAt'>;
  }

  function hasValidDeadline(deadlineType: DeadlineType, deadlineAt: string) {
    return deadlineType !== 'custom' || Boolean(deadlineAt);
  }

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
      cardPower < 1 ||
      !hasValidDeadline(dailyDeadlineType, dailyDeadlineAt)
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
        recurrence: dailyRecurrence,
        deadlineType: dailyDeadlineType,
        deadlineAt: normalizeDeadlineAt(dailyDeadlineType, dailyDeadlineAt),
      },
    ]);
    setDailyTitle('');
    setDailyXp('10');
    setDailyTarget('1');
    setDailyPower('3');
    setDailyRecurrence('daily');
    setDailyDeadlineType('endOfDay');
    setDailyDeadlineAt('');
  }

  function updateDraftCard(
    cardId: string,
    field: 'title' | 'cardPower',
    value: string,
    setter: Dispatch<SetStateAction<DraftCard[]>>,
  ) {
    setter((current) =>
      current.map((card) => (card.id === cardId ? { ...card, [field]: value } : card)),
    );
  }

  function addDraftCard(setter: Dispatch<SetStateAction<DraftCard[]>>, defaultPower: string) {
    setter((current) => [...current, createDraftCard(defaultPower)]);
  }

  function removeDraftCard(cardId: string, setter: Dispatch<SetStateAction<DraftCard[]>>, defaultPower: string) {
    setter((current) => {
      const nextCards = current.filter((card) => card.id !== cardId);
      return nextCards.length > 0 ? nextCards : [createDraftCard(defaultPower)];
    });
  }

  function addSideQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = sideTitle.trim();
    const reward = sideReward.trim();
    const xp = Number(sideXp);
    const objectives = normalizeDraftCards(sideCards, Math.max(4, Math.ceil((xp || 12) / 2)));

    if (
      !title ||
      !reward ||
      Number.isNaN(xp) ||
      xp < 0 ||
      objectives.length === 0 ||
      !hasValidDeadline(sideDeadlineType, sideDeadlineAt)
    ) {
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
        recurrence: sideRecurrence,
        deadlineType: sideDeadlineType,
        deadlineAt: normalizeDeadlineAt(sideDeadlineType, sideDeadlineAt),
      },
    ]);
    setSideTitle('');
    setSideXp('10');
    setSideDifficulty('');
    setSideReward('');
    setSideMonsterMode('auto');
    setSideMonsterName('');
    setSideCards([createDraftCard('6')]);
    setSideRecurrence('none');
    setSideDeadlineType('none');
    setSideDeadlineAt('');
  }

  function addMainQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = mainTitle.trim();
    const reward = mainReward.trim();
    const objectives = normalizeDraftCards(mainCards, 8);

    if (!title || !reward || objectives.length === 0 || !hasValidDeadline(mainDeadlineType, mainDeadlineAt)) {
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
        recurrence: mainRecurrence,
        deadlineType: mainDeadlineType,
        deadlineAt: normalizeDeadlineAt(mainDeadlineType, mainDeadlineAt),
      },
    ]);
    setMainTitle('');
    setMainReward('');
    setMainMonsterMode('auto');
    setMainMonsterName('');
    setMainCards([createDraftCard('10')]);
    setMainRecurrence('none');
    setMainDeadlineType('none');
    setMainDeadlineAt('');
  }

  function setDailyQuestProgress(questId: string, progressCount: number) {
    const completedAt = new Date().toISOString();
    let historyEntry: Omit<QuestHistoryEntry, 'id' | 'completedAt'> | null = null;

    setDailyQuests((current) =>
      current.map((quest) => {
        if (quest.id !== questId) {
          return quest;
        }

        const nextProgress = clampCount(progressCount, 0, quest.targetCount);
        const nextDone = nextProgress >= quest.targetCount;

        if (!isDailyQuestComplete(quest) && nextDone) {
          historyEntry = {
            family: 'daily',
            questId: quest.id,
            title: quest.title,
            reward: `${quest.xp} XP`,
          };
        }

        return {
          ...quest,
          progressCount: nextProgress,
          completedAt: nextDone ? quest.completedAt ?? completedAt : undefined,
        };
      }),
    );

    if (historyEntry) {
      logQuestCompletion(historyEntry, completedAt);
    }
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
      const completedAt = new Date().toISOString();
      let historyEntry: Omit<QuestHistoryEntry, 'id' | 'completedAt'> | null = null;

      setDailyQuests((current) =>
        current.map((quest) => {
          if (!cardId.startsWith(`${quest.id}-card-`)) {
            return quest;
          }

          const nextProgress = clampCount(quest.progressCount + 1, 0, quest.targetCount);

          if (!isDailyQuestComplete(quest) && nextProgress >= quest.targetCount) {
            historyEntry = {
              family: 'daily',
              questId: quest.id,
              title: quest.title,
              reward: `${quest.xp} XP`,
            };
          }

          return {
            ...quest,
            progressCount: nextProgress,
            completedAt: nextProgress >= quest.targetCount ? quest.completedAt ?? completedAt : undefined,
          };
        }),
      );

      if (historyEntry) {
        logQuestCompletion(historyEntry, completedAt);
      }
      return;
    }

    const setter = selectedBoard.kind === 'side' ? setSideQuests : setMainQuests;
    const activeQuestList = selectedBoard.kind === 'side' ? sideQuests : mainQuests;
    const priorQuest = activeQuestList.find((quest) => quest.id === selectedBoard.questId);
    const completedAt = new Date().toISOString();

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
              completedAt:
                quest.objectives.every((objective) =>
                  objective.id === cardId ? true : objective.done,
                )
                  ? quest.completedAt ?? completedAt
                  : undefined,
            }
          : quest,
      ),
    );

    if (
      priorQuest &&
      !priorQuest.done &&
      priorQuest.objectives.every((objective) => (objective.id === cardId ? true : objective.done))
    ) {
      logQuestCompletion(buildQuestHistoryEntry(selectedBoard.kind, priorQuest), completedAt);
    }
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
            ? {
                ...quest,
                progressCount: clampCount(quest.progressCount - 1, 0, quest.targetCount),
                completedAt: undefined,
              }
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
          completedAt: objectives.every((objective) => objective.done) ? quest.completedAt : undefined,
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
      setDailyQuests((current) =>
        current.map((quest) => ({ ...quest, progressCount: 0, completedAt: undefined })),
      );
      return;
    }

    const setter = selectedBoard.kind === 'side' ? setSideQuests : setMainQuests;
    setter((current) =>
      current.map((quest) =>
        quest.id === selectedBoard.questId
          ? {
              ...quest,
              done: false,
              completedAt: undefined,
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
    kind: 'side' | 'main',
    setter: Dispatch<SetStateAction<Quest[]>>,
  ) {
    const completedAt = new Date().toISOString();
    let historyEntry: Omit<QuestHistoryEntry, 'id' | 'completedAt'> | null = null;

    setter((current) =>
      current.map((quest) =>
        quest.id === questId
          ? (() => {
              const nextDone = !quest.done;
              const objectives = quest.objectives.map((objective) => ({ ...objective, done: nextDone }));

              if (!quest.done && nextDone) {
                historyEntry = buildQuestHistoryEntry(kind, quest);
              }

              return {
                ...quest,
                done: nextDone,
                completedAt: nextDone ? quest.completedAt ?? completedAt : undefined,
                objectives,
              };
            })()
          : quest,
      ),
    );

    if (historyEntry) {
      logQuestCompletion(historyEntry, completedAt);
    }
  }

  function toggleObjective(
    questId: string,
    objectiveId: string,
    kind: 'side' | 'main',
    setter: Dispatch<SetStateAction<Quest[]>>,
  ) {
    const completedAt = new Date().toISOString();
    let historyEntry: Omit<QuestHistoryEntry, 'id' | 'completedAt'> | null = null;

    setter((current) =>
      current.map((quest) => {
        if (quest.id !== questId) {
          return quest;
        }

        const wasComplete = isQuestComplete(quest);
        const objectives = quest.objectives.map((objective) =>
          objective.id === objectiveId ? { ...objective, done: !objective.done } : objective,
        );
        const nextDone = objectives.length > 0 && objectives.every((objective) => objective.done);

        if (!wasComplete && nextDone) {
          historyEntry = buildQuestHistoryEntry(kind, quest);
        }

        return {
          ...quest,
          objectives,
          done: nextDone,
          completedAt: nextDone ? quest.completedAt ?? completedAt : undefined,
        };
      }),
    );

    if (historyEntry) {
      logQuestCompletion(historyEntry, completedAt);
    }
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
            <div className="form-grid">
              <select onChange={(event) => setDailyRecurrence(event.target.value as Recurrence)} value={dailyRecurrence}>
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select onChange={(event) => setDailyDeadlineType(event.target.value as DeadlineType)} value={dailyDeadlineType}>
                {deadlineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {dailyDeadlineType === 'custom' ? (
              <input onChange={(event) => setDailyDeadlineAt(event.target.value)} type="date" value={dailyDeadlineAt} />
            ) : null}
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
            <div className="form-grid">
              <select onChange={(event) => setSideRecurrence(event.target.value as Recurrence)} value={sideRecurrence}>
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select onChange={(event) => setSideDeadlineType(event.target.value as DeadlineType)} value={sideDeadlineType}>
                {deadlineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {sideDeadlineType === 'custom' ? (
              <input onChange={(event) => setSideDeadlineAt(event.target.value)} type="date" value={sideDeadlineAt} />
            ) : null}
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
            <div className="card-builder" aria-label="Side quest cards">
              {sideCards.map((card, index) => (
                <div className="card-builder-row" key={card.id}>
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setSideCards)}
                    placeholder={`Card ${index + 1} title`}
                    value={card.title}
                  />
                  <input
                    min="1"
                    onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setSideCards)}
                    placeholder="Damage"
                    type="number"
                    value={card.cardPower}
                  />
                  <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setSideCards, '6')} type="button">
                    Remove
                  </button>
                </div>
              ))}
              <button className="ghost-button add-card-button" onClick={() => addDraftCard(setSideCards, '6')} type="button">
                Add Card
              </button>
            </div>
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
            <div className="form-grid">
              <select onChange={(event) => setMainRecurrence(event.target.value as Recurrence)} value={mainRecurrence}>
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select onChange={(event) => setMainDeadlineType(event.target.value as DeadlineType)} value={mainDeadlineType}>
                {deadlineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {mainDeadlineType === 'custom' ? (
              <input onChange={(event) => setMainDeadlineAt(event.target.value)} type="date" value={mainDeadlineAt} />
            ) : null}
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
            <div className="card-builder" aria-label="Main quest cards">
              {mainCards.map((card, index) => (
                <div className="card-builder-row" key={card.id}>
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setMainCards)}
                    placeholder={`Card ${index + 1} title`}
                    value={card.title}
                  />
                  <input
                    min="1"
                    onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setMainCards)}
                    placeholder="Damage"
                    type="number"
                    value={card.cardPower}
                  />
                  <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setMainCards, '10')} type="button">
                    Remove
                  </button>
                </div>
              ))}
              <button className="ghost-button add-card-button" onClick={() => addDraftCard(setMainCards, '10')} type="button">
                Add Card
              </button>
            </div>
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
                  <small className="quest-rule-copy">
                    {formatRecurrence(quest.recurrence)} <span aria-hidden="true">·</span> {formatDeadline(quest.deadlineType, quest.deadlineAt)}
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
                    <small className="quest-rule-copy">
                      {formatRecurrence(quest.recurrence)} <span aria-hidden="true">·</span> {formatDeadline(quest.deadlineType, quest.deadlineAt)}
                    </small>
                    <p className="reward-pill">Reward: {quest.reward}</p>
                  </div>
                </div>
                <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                  {quest.objectives.map((objective) => (
                    <li key={objective.id}>
                      <label className="objective-check">
                        <input checked={objective.done} onChange={() => toggleObjective(quest.id, objective.id, 'side', setSideQuests)} type="checkbox" />
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
                    <small className="quest-rule-copy">
                      {formatRecurrence(quest.recurrence)} <span aria-hidden="true">·</span> {formatDeadline(quest.deadlineType, quest.deadlineAt)}
                    </small>
                    <p className="reward-pill">Reward: {quest.reward}</p>
                  </div>
                </div>
                <ul className="objective-list" aria-label={`${quest.title} objectives`}>
                  {quest.objectives.map((objective) => (
                    <li key={objective.id}>
                      <label className="objective-check">
                        <input checked={objective.done} onChange={() => toggleObjective(quest.id, objective.id, 'main', setMainQuests)} type="checkbox" />
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

      <section className="section">
        <div className="section-heading">
          <h2>Completed History</h2>
          <span>{recentHistory.length} clears logged</span>
        </div>
        <div className="card-stack">
          {recentHistory.length === 0 ? (
            <article className="game-card list-card history-card">
              <strong>No completed quests yet</strong>
              <small>When you clear quests, their completion date will be saved here.</small>
            </article>
          ) : (
            recentHistory.map((entry) => (
              <article className="game-card list-card history-card" key={entry.id}>
                <div className="battle-card-topline">
                  <span className="battle-card-type">{entry.family} clear</span>
                  <span className="battle-stat-chip">{new Date(entry.completedAt).toLocaleDateString()}</span>
                </div>
                <div className="deck-card-copy">
                  <strong>{entry.title}</strong>
                  <small>{new Date(entry.completedAt).toLocaleString()}</small>
                  <p className="reward-pill">Reward: {entry.reward}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

    </main>
  );
}
