import { baseXp, defaultDailyQuests, defaultMainQuests, defaultSideQuests, rankTitles } from './gameData';
import type {
  AppState,
  BattleCard,
  BattleState,
  BoardSelection,
  DailyQuest,
  DeadlineType,
  DraftCard,
  Objective,
  Quest,
  QuestHistoryEntry,
  Recurrence,
} from './types';

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function clampCount(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function isDailyQuestComplete(quest: DailyQuest) {
  return quest.cards.length > 0 && quest.cards.every((card) => card.done);
}

export function getDailyProgressLabel(quest: DailyQuest) {
  const playedCount = quest.cards.filter((card) => card.done).length;
  return `${playedCount} / ${quest.cards.length} skills committed`;
}

export function getDailyQuestPlayedCount(quest: DailyQuest) {
  return quest.cards.filter((card) => card.done).length;
}

export function normalizeMonsterArt(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function isImageLike(value: string) {
  return /^(https?:\/\/|data:image\/|\/)/i.test(value);
}

export function normalizeMonsterHp(value: number | undefined, fallback: number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

export function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
}

export function getEndOfDay(date: Date) {
  const end = getStartOfDay(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getEndOfWeek(date: Date) {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function resolveDeadlineAt(deadlineType: DeadlineType, deadlineAt?: string, now = new Date()) {
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

export function normalizeDeadlineAt(deadlineType: DeadlineType, deadlineAt?: string) {
  return deadlineType === 'custom' ? deadlineAt || undefined : undefined;
}

export function formatDeadline(deadlineType: DeadlineType, deadlineAt?: string) {
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

export function formatRecurrence(recurrence: Recurrence) {
  if (recurrence === 'daily') {
    return 'Repeats daily';
  }

  if (recurrence === 'weekly') {
    return 'Repeats weekly';
  }

  return 'One-time mission';
}

export function shouldResetRecurring(completedAt: string | undefined, recurrence: Recurrence, now = new Date()) {
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

export function hasRecurringCycleAdvanced(cycleStartedAt: string | undefined, recurrence: Recurrence, now = new Date()) {
  if (!cycleStartedAt || recurrence === 'none') {
    return false;
  }

  const cycleStart = new Date(cycleStartedAt);

  if (Number.isNaN(cycleStart.getTime())) {
    return false;
  }

  if (recurrence === 'daily') {
    return getStartOfDay(now).getTime() > getStartOfDay(cycleStart).getTime();
  }

  if (recurrence === 'weekly') {
    return getStartOfWeek(now).getTime() > getStartOfWeek(cycleStart).getTime();
  }

  return false;
}

export function getQuestCompletion(quest: Quest) {
  const objectiveCount = quest.objectives.length;
  const completedObjectives = quest.objectives.filter((objective) => objective.done).length;

  return {
    completedObjectives,
    objectiveCount,
    progressLabel:
      objectiveCount === 0 ? 'No sub-missions yet' : `${completedObjectives} / ${objectiveCount} skills committed`,
  };
}

export function isQuestComplete(quest: Quest) {
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

export function autoGenerateMonsterName(kind: 'daily' | 'side' | 'main', title: string) {
  const words = slugWords(title);
  const anchor = words[0] ?? 'quest';
  const tail = words[words.length - 1] ?? 'trial';
  const dailyTemplates = [
    `The ${titleize(anchor)} Hydra`,
    `${titleize(anchor)} Habit Fang`,
    `The ${titleize(tail)} Drip Beast`,
  ];
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
  const templates = kind === 'daily' ? dailyTemplates : kind === 'side' ? sideTemplates : mainTemplates;
  const hash = words.join('').length % templates.length;

  return templates[hash];
}

function getXpRequiredForLevel(level: number) {
  return 60 + (level - 1) * 30;
}

export function getRankProgress(total: number) {
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

export function buildInitialState(): AppState {
  return {
    dailyQuests: defaultDailyQuests,
    sideQuests: defaultSideQuests,
    mainQuests: defaultMainQuests,
    completionHistory: [],
  };
}

export function buildEmptyState(): AppState {
  return {
    dailyQuests: [],
    sideQuests: [],
    mainQuests: [],
    completionHistory: [],
  };
}

export function normalizeDailyQuest(
  quest: Partial<DailyQuest> & {
    id?: string;
    title?: string;
    xp?: number;
    done?: boolean;
    targetCount?: number;
    progressCount?: number;
    cardPower?: number;
  },
) {
  const cards = Array.isArray(quest.cards)
    ? quest.cards.map(normalizeObjective)
    : (() => {
        const targetCount = Math.max(1, Number(quest.targetCount ?? 1));
        const fallbackProgress = quest.done ? targetCount : 0;
        const progressCount = clampCount(Number(quest.progressCount ?? fallbackProgress), 0, targetCount);
        const cardPower = Math.max(1, Number(quest.cardPower ?? 3));

        return Array.from({ length: targetCount }, (_, index) => ({
          id: createId('daily-card'),
          title: targetCount === 1 ? quest.title ?? 'Daily card' : `${quest.title ?? 'Daily card'} ${index + 1}`,
          symbol: '🗡️',
          cardPower,
          done: index < progressCount,
        }));
      })();

  return {
    id: quest.id ?? createId('daily'),
    title: quest.title ?? 'New daily routine',
    xp: Number(quest.xp ?? 10),
    cards,
    monsterName: quest.monsterName?.trim() || undefined,
    monsterArt: quest.monsterArt?.trim() || undefined,
    monsterHp: normalizeMonsterHp(quest.monsterHp, cards.reduce((total, card) => total + card.cardPower, 0)),
    recurrence: quest.recurrence ?? 'daily',
    deadlineType: quest.deadlineType ?? 'endOfDay',
    deadlineAt: normalizeDeadlineAt(quest.deadlineType ?? 'endOfDay', quest.deadlineAt),
    completedAt: quest.completedAt,
    cycleStartedAt: quest.cycleStartedAt ?? new Date().toISOString(),
  };
}

export function normalizeObjective(objective: Partial<Objective>) {
  return {
    id: objective.id ?? createId('objective'),
    title: objective.title ?? 'New step',
    symbol: objective.symbol?.trim() || '🗡️',
    cardPower: Math.max(1, Number(objective.cardPower ?? 4)),
    done: Boolean(objective.done),
  };
}

export function createDraftCard(defaultPower = '4', defaultSymbol = '🗡️'): DraftCard {
  return {
    id: createId('draft-card'),
    title: '',
    symbol: defaultSymbol,
    cardPower: defaultPower,
  };
}

export function objectivesToDraftCards(objectives: Objective[]) {
  return objectives.map((objective) => ({
    id: createId('draft-card'),
    title: objective.title,
    symbol: objective.symbol || '🗡️',
    cardPower: String(objective.cardPower),
  }));
}

export function normalizeDraftCards(cards: DraftCard[], fallbackBasePower: number) {
  return cards
    .map((card, index) => ({
      title: card.title.trim(),
      symbol: card.symbol.trim() || '🗡️',
      cardPower: Number(card.cardPower),
      fallbackPower: fallbackBasePower + index,
    }))
    .filter((card) => card.title)
    .map((card) => ({
      id: createId('objective'),
      title: card.title,
      symbol: card.symbol,
      cardPower:
        Number.isFinite(card.cardPower) && card.cardPower > 0 ? card.cardPower : card.fallbackPower,
      done: false,
    }));
}

export function preserveObjectiveProgress(nextObjectives: Objective[], currentObjectives: Objective[]) {
  return nextObjectives.map((objective, index) => ({
    ...objective,
    done: currentObjectives[index]?.done ?? false,
  }));
}

export function migrateLegacyCycleStartedAt<T extends DailyQuest | Quest>(
  quest: T,
  sourceStorageKey: string | null,
): T {
  if (sourceStorageKey !== 'quest-cat-state-v7' || quest.recurrence === 'none') {
    return quest;
  }

  return {
    ...quest,
    cycleStartedAt: quest.completedAt ?? new Date(0).toISOString(),
  };
}

export function normalizeQuest(quest: Partial<Quest>) {
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
    monsterArt: quest.monsterArt?.trim() || undefined,
    monsterHp: normalizeMonsterHp(quest.monsterHp, objectives.reduce((total, objective) => total + objective.cardPower, 0)),
    reward: quest.reward ?? 'Mystery reward',
    done,
    objectives,
    recurrence: quest.recurrence ?? 'none',
    deadlineType: quest.deadlineType ?? 'none',
    deadlineAt: normalizeDeadlineAt(quest.deadlineType ?? 'none', quest.deadlineAt),
    completedAt: quest.completedAt,
    cycleStartedAt: quest.cycleStartedAt ?? new Date().toISOString(),
  };
}

export function normalizeHistoryEntry(entry: Partial<QuestHistoryEntry>): QuestHistoryEntry {
  return {
    id: entry.id ?? createId('history'),
    family: (entry.family as QuestHistoryEntry['family']) ?? 'side',
    questId: entry.questId ?? createId('quest-ref'),
    title: entry.title ?? 'Completed quest',
    reward: entry.reward ?? 'Reward claimed',
    completedAt: entry.completedAt ?? new Date().toISOString(),
    outcome: entry.outcome === 'loss' ? 'loss' : 'win',
  };
}

export function buildBattleState(
  selection: BoardSelection,
  dailyQuests: DailyQuest[],
  sideQuests: Quest[],
  mainQuests: Quest[],
): BattleState | null {
  if (selection.kind === 'daily') {
    const quest = dailyQuests.find((item) => item.id === selection.questId);

    if (!quest) {
      return null;
    }

    const cards = quest.cards.map<BattleCard>((card) => ({
      id: card.id,
      originId: quest.id,
      title: card.title,
      symbol: card.symbol || '🗡️',
      cardPower: card.cardPower,
      played: card.done,
      flavor: `${card.cardPower} power strike`,
      family: 'daily',
    }));
    const cardDamageTotal = cards.reduce((total, card) => total + card.cardPower, 0);
    const totalHp = normalizeMonsterHp(quest.monsterHp, cardDamageTotal);
    const currentHp = Math.max(
      0,
      totalHp - cards.filter((card) => card.played).reduce((total, card) => total + card.cardPower, 0),
    );

    return {
      title: quest.title,
      subtitle: `Daily training reward: +${quest.xp} XP.`,
      monsterArt: normalizeMonsterArt(quest.monsterArt, '🗡️'),
      monsterName: quest.monsterName || autoGenerateMonsterName('daily', quest.title),
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
    symbol: objective.symbol || '🗡️',
    cardPower: objective.cardPower,
    played: objective.done,
    flavor: selection.kind === 'side' ? 'Gate-clearing technique' : 'Raid-finishing technique',
    family: selection.kind,
  }));
  const cardDamageTotal = cards.reduce((total, card) => total + card.cardPower, 0);
  const totalHp = normalizeMonsterHp(quest.monsterHp, cardDamageTotal);
  const currentHp = Math.max(
    0,
    totalHp - cards.filter((card) => card.played).reduce((total, card) => total + card.cardPower, 0),
  );
  const monsterName = quest.monsterName || autoGenerateMonsterName(selection.kind, quest.title);

  return {
    title: quest.title,
    subtitle: quest.reward,
    monsterArt: normalizeMonsterArt(quest.monsterArt, '🗡️'),
    monsterName,
    monsterMood: selection.kind === 'side' ? 'A quick skirmish with bonus loot.' : 'A larger boss battle with story stakes.',
    totalHp: Math.max(totalHp, 1),
    currentHp,
    cards,
  };
}

export function getTotalXp(dailyQuests: DailyQuest[]) {
  const earnedXp = dailyQuests
    .filter((quest) => isDailyQuestComplete(quest))
    .reduce((total, quest) => total + quest.xp, 0);

  return baseXp + earnedXp;
}

export function getStreakStats(history: QuestHistoryEntry[]) {
  const winningDays = [...new Set(
    history
      .filter((entry) => entry.outcome === 'win')
      .map((entry) => getStartOfDay(new Date(entry.completedAt)).toISOString()),
  )]
    .map((value) => new Date(value))
    .sort((left, right) => left.getTime() - right.getTime());

  let bestStreak = 0;
  let currentStreak = 0;

  for (let index = 0; index < winningDays.length; index += 1) {
    if (index === 0) {
      currentStreak = 1;
    } else {
      const previous = winningDays[index - 1];
      const current = winningDays[index];
      const dayDiff = Math.round((getStartOfDay(current).getTime() - getStartOfDay(previous).getTime()) / 86_400_000);
      currentStreak = dayDiff === 1 ? currentStreak + 1 : 1;
    }

    bestStreak = Math.max(bestStreak, currentStreak);
  }

  const today = getStartOfDay(new Date());
  const yesterday = getStartOfDay(new Date(today.getTime() - 86_400_000));
  const mostRecent = winningDays[winningDays.length - 1];
  const activeCurrentStreak =
    mostRecent &&
    (getStartOfDay(mostRecent).getTime() === today.getTime() ||
      getStartOfDay(mostRecent).getTime() === yesterday.getTime())
      ? currentStreak
      : 0;

  return {
    currentStreak: activeCurrentStreak,
    bestStreak,
    totalWins: history.filter((entry) => entry.outcome === 'win').length,
  };
}

export function getNextRewardMilestone(totalWins: number) {
  const milestones = [
    { wins: 3, reward: 'Pick a tiny reward after 3 wins' },
    { wins: 7, reward: 'Claim a weekly treat after 7 wins' },
    { wins: 15, reward: 'Unlock a bigger reward after 15 wins' },
    { wins: 30, reward: 'Plan a boss-level celebration after 30 wins' },
  ];

  return milestones.find((milestone) => milestone.wins > totalWins) ?? milestones[milestones.length - 1];
}

export function createQuickStartDailyQuest(): DailyQuest {
  return {
    id: createId('daily'),
    title: 'Morning reset',
    xp: 14,
    cards: [
      { id: createId('daily-card'), title: 'Make the bed', symbol: '🛏️', cardPower: 4, done: false },
      { id: createId('daily-card'), title: 'Drink water', symbol: '💧', cardPower: 4, done: false },
      { id: createId('daily-card'), title: 'Open the blinds', symbol: '☀️', cardPower: 4, done: false },
    ],
    monsterArt: '🌤️',
    monsterHp: 12,
    recurrence: 'daily',
    deadlineType: 'endOfDay',
    cycleStartedAt: new Date().toISOString(),
  };
}

export function createQuickStartSideQuest(): Quest {
  return {
    id: createId('side'),
    title: 'Desk rescue',
    xp: 12,
    difficulty: 'Easy',
    reward: 'A coffee or tea break',
    monsterArt: '🧹',
    monsterHp: 15,
    done: false,
    recurrence: 'none',
    deadlineType: 'none',
    cycleStartedAt: new Date().toISOString(),
    objectives: [
      { id: createId('objective'), title: 'Clear trash', symbol: '🗑️', cardPower: 4, done: false },
      { id: createId('objective'), title: 'Put things back', symbol: '📚', cardPower: 5, done: false },
      { id: createId('objective'), title: 'Wipe surface', symbol: '✨', cardPower: 6, done: false },
    ],
  };
}

export function createQuickStartMainQuest(): Quest {
  return {
    id: createId('main'),
    title: 'Win this week',
    reward: 'A weekend reward of your choice',
    monsterArt: '🏆',
    monsterHp: 24,
    done: false,
    recurrence: 'weekly',
    deadlineType: 'endOfWeek',
    cycleStartedAt: new Date().toISOString(),
    objectives: [
      { id: createId('objective'), title: 'Clear 3 daily decks', symbol: '🔥', cardPower: 8, done: false },
      { id: createId('objective'), title: 'Finish 1 side quest', symbol: '🗺️', cardPower: 8, done: false },
      { id: createId('objective'), title: 'Log 5 wins', symbol: '⭐', cardPower: 8, done: false },
    ],
  };
}
