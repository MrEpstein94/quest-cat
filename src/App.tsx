import { useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { BattleBoard } from './BattleBoard';
import { OnboardingCard } from './OnboardingCard';
import { ProfilePanel } from './ProfilePanel';
import { deadlineOptions, recurrenceOptions } from './gameData';
import {
  autoGenerateMonsterName,
  buildBattleState,
  buildEmptyState,
  buildInitialState,
  clampCount,
  createDraftCard,
  createId,
  createQuickStartDailyQuest,
  createQuickStartMainQuest,
  createQuickStartSideQuest,
  formatDeadline,
  formatRecurrence,
  getDailyProgressLabel,
  getDailyQuestPlayedCount,
  getQuestCompletion,
  getRankProgress,
  getStreakStats,
  getTotalXp,
  getNextRewardMilestone,
  hasRecurringCycleAdvanced,
  isDailyQuestComplete,
  isQuestComplete,
  normalizeDeadlineAt,
  normalizeDraftCards,
  objectivesToDraftCards,
  preserveObjectiveProgress,
  shouldResetRecurring,
} from './questDomain';
import {
  deleteStoredProfile,
  loadProfileState,
  loadProfiles,
  parseProfileBackup,
  saveProfileState,
  saveProfilesIndex,
  serializeProfileBackup,
} from './storage';
import type { BoardSelection, DailyQuest, DeadlineType, DraftCard, Objective, Quest, QuestHistoryEntry, Recurrence } from './types';

export default function App() {
  const [loadedProfiles] = useState(loadProfiles);
  const [profiles, setProfiles] = useState(loadedProfiles.index.profiles);
  const [activeProfileId, setActiveProfileId] = useState(loadedProfiles.initialProfileId);
  const [dailyQuests, setDailyQuests] = useState(loadedProfiles.initialState.dailyQuests);
  const [sideQuests, setSideQuests] = useState(loadedProfiles.initialState.sideQuests);
  const [mainQuests, setMainQuests] = useState(loadedProfiles.initialState.mainQuests);
  const [completionHistory, setCompletionHistory] = useState(loadedProfiles.initialState.completionHistory);
  const [builderMode, setBuilderMode] = useState<'daily' | 'side' | 'main' | null>('side');
  const [selectedBoard, setSelectedBoard] = useState<BoardSelection | null>(null);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState(0);

  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyXp, setDailyXp] = useState('10');
  const [dailyCards, setDailyCards] = useState<DraftCard[]>([createDraftCard('3')]);
  const [dailyMonsterMode, setDailyMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [dailyMonsterName, setDailyMonsterName] = useState('');
  const [dailyMonsterArt, setDailyMonsterArt] = useState('🗡️');
  const [dailyMonsterHp, setDailyMonsterHp] = useState('10');
  const [dailyRecurrence, setDailyRecurrence] = useState<Recurrence>('daily');
  const [dailyDeadlineType, setDailyDeadlineType] = useState<DeadlineType>('endOfDay');
  const [dailyDeadlineAt, setDailyDeadlineAt] = useState('');
  const [editingDailyId, setEditingDailyId] = useState<string | null>(null);
  const [editingDailyTitle, setEditingDailyTitle] = useState('');
  const [editingDailyXp, setEditingDailyXp] = useState('10');
  const [editingDailyCards, setEditingDailyCards] = useState<DraftCard[]>([createDraftCard('3')]);
  const [editingDailyMonsterMode, setEditingDailyMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [editingDailyMonsterName, setEditingDailyMonsterName] = useState('');
  const [editingDailyMonsterArt, setEditingDailyMonsterArt] = useState('🗡️');
  const [editingDailyMonsterHp, setEditingDailyMonsterHp] = useState('10');
  const [editingDailyRecurrence, setEditingDailyRecurrence] = useState<Recurrence>('daily');
  const [editingDailyDeadlineType, setEditingDailyDeadlineType] = useState<DeadlineType>('endOfDay');
  const [editingDailyDeadlineAt, setEditingDailyDeadlineAt] = useState('');

  const [sideTitle, setSideTitle] = useState('');
  const [sideXp, setSideXp] = useState('10');
  const [sideDifficulty, setSideDifficulty] = useState('');
  const [sideReward, setSideReward] = useState('');
  const [sideMonsterMode, setSideMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [sideMonsterName, setSideMonsterName] = useState('');
  const [sideMonsterArt, setSideMonsterArt] = useState('🗡️');
  const [sideMonsterHp, setSideMonsterHp] = useState('12');
  const [sideCards, setSideCards] = useState<DraftCard[]>([createDraftCard('6')]);
  const [sideRecurrence, setSideRecurrence] = useState<Recurrence>('none');
  const [sideDeadlineType, setSideDeadlineType] = useState<DeadlineType>('none');
  const [sideDeadlineAt, setSideDeadlineAt] = useState('');
  const [editingSideId, setEditingSideId] = useState<string | null>(null);
  const [editingSideTitle, setEditingSideTitle] = useState('');
  const [editingSideXp, setEditingSideXp] = useState('10');
  const [editingSideDifficulty, setEditingSideDifficulty] = useState('');
  const [editingSideReward, setEditingSideReward] = useState('');
  const [editingSideMonsterMode, setEditingSideMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [editingSideMonsterName, setEditingSideMonsterName] = useState('');
  const [editingSideMonsterArt, setEditingSideMonsterArt] = useState('🗡️');
  const [editingSideMonsterHp, setEditingSideMonsterHp] = useState('12');
  const [editingSideCards, setEditingSideCards] = useState<DraftCard[]>([createDraftCard('6')]);
  const [editingSideRecurrence, setEditingSideRecurrence] = useState<Recurrence>('none');
  const [editingSideDeadlineType, setEditingSideDeadlineType] = useState<DeadlineType>('none');
  const [editingSideDeadlineAt, setEditingSideDeadlineAt] = useState('');

  const [mainTitle, setMainTitle] = useState('');
  const [mainReward, setMainReward] = useState('');
  const [mainMonsterMode, setMainMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [mainMonsterName, setMainMonsterName] = useState('');
  const [mainMonsterArt, setMainMonsterArt] = useState('🗡️');
  const [mainMonsterHp, setMainMonsterHp] = useState('20');
  const [mainCards, setMainCards] = useState<DraftCard[]>([createDraftCard('10')]);
  const [mainRecurrence, setMainRecurrence] = useState<Recurrence>('none');
  const [mainDeadlineType, setMainDeadlineType] = useState<DeadlineType>('none');
  const [mainDeadlineAt, setMainDeadlineAt] = useState('');
  const [editingMainId, setEditingMainId] = useState<string | null>(null);
  const [editingMainTitle, setEditingMainTitle] = useState('');
  const [editingMainReward, setEditingMainReward] = useState('');
  const [editingMainMonsterMode, setEditingMainMonsterMode] = useState<'auto' | 'custom'>('auto');
  const [editingMainMonsterName, setEditingMainMonsterName] = useState('');
  const [editingMainMonsterArt, setEditingMainMonsterArt] = useState('🗡️');
  const [editingMainMonsterHp, setEditingMainMonsterHp] = useState('20');
  const [editingMainCards, setEditingMainCards] = useState<DraftCard[]>([createDraftCard('10')]);
  const [editingMainRecurrence, setEditingMainRecurrence] = useState<Recurrence>('none');
  const [editingMainDeadlineType, setEditingMainDeadlineType] = useState<DeadlineType>('none');
  const [editingMainDeadlineAt, setEditingMainDeadlineAt] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    daily: false,
    side: false,
    main: false,
    history: false,
    forge: false,
  });
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryTitle, setEditingHistoryTitle] = useState('');
  const [editingHistoryReward, setEditingHistoryReward] = useState('');
  const [editingHistoryCompletedAt, setEditingHistoryCompletedAt] = useState('');
  const [editingHistoryOutcome, setEditingHistoryOutcome] = useState<'win' | 'loss'>('win');
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveProfileState(activeProfileId, { dailyQuests, sideQuests, mainQuests, completionHistory });
  }, [activeProfileId, completionHistory, dailyQuests, sideQuests, mainQuests]);

  useEffect(() => {
    function resetRecurringQuests() {
      const now = new Date();
      const historyEntries: QuestHistoryEntry[] = [];

      setDailyQuests((current) =>
        current.map((quest) =>
          hasRecurringCycleAdvanced(quest.cycleStartedAt, quest.recurrence, now)
            ? (() => {
                if (!isDailyQuestComplete(quest)) {
                  historyEntries.push({
                    id: createId('history'),
                    family: 'daily',
                    questId: quest.id,
                    title: quest.title,
                    reward: `${quest.xp} XP`,
                    completedAt: now.toISOString(),
                    outcome: 'loss',
                  });
                }

                return {
                  ...quest,
                  completedAt: undefined,
                  cycleStartedAt: now.toISOString(),
                  cards: quest.cards.map((card) => ({ ...card, done: false })),
                };
              })()
            : shouldResetRecurring(quest.completedAt, quest.recurrence, now)
              ? {
                  ...quest,
                  completedAt: undefined,
                  cycleStartedAt: now.toISOString(),
                  cards: quest.cards.map((card) => ({ ...card, done: false })),
                }
              : quest,
        ),
      );

      const resetQuestCollection = (
        setter: Dispatch<SetStateAction<Quest[]>>,
        family: QuestHistoryEntry['family'],
      ) => {
        setter((current) =>
          current.map((quest) =>
            hasRecurringCycleAdvanced(quest.cycleStartedAt, quest.recurrence, now)
              ? (() => {
                  if (!isQuestComplete(quest)) {
                    historyEntries.push({
                      id: createId('history'),
                      family,
                      questId: quest.id,
                      title: quest.title,
                      reward: quest.reward,
                      completedAt: now.toISOString(),
                      outcome: 'loss',
                    });
                  }

                  return {
                    ...quest,
                    done: false,
                    completedAt: undefined,
                    cycleStartedAt: now.toISOString(),
                    objectives: quest.objectives.map((objective) => ({ ...objective, done: false })),
                  };
                })()
              : shouldResetRecurring(quest.completedAt, quest.recurrence, now)
                ? {
                    ...quest,
                    done: false,
                    completedAt: undefined,
                    cycleStartedAt: now.toISOString(),
                    objectives: quest.objectives.map((objective) => ({ ...objective, done: false })),
                  }
                : quest,
          ),
        );
      };

      resetQuestCollection(setSideQuests, 'side');
      resetQuestCollection(setMainQuests, 'main');

      if (historyEntries.length > 0) {
        setCompletionHistory((current) => [...historyEntries, ...current]);
      }
    }

    resetRecurringQuests();
    const intervalId = window.setInterval(resetRecurringQuests, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const completedCount = dailyQuests.filter((quest) => isDailyQuestComplete(quest)).length;
  const completedSideCount = sideQuests.filter((quest) => quest.done).length;
  const completedMainCount = mainQuests.filter((quest) => quest.done).length;
  const sideQuestXp = sideQuests.reduce((total, quest) => total + (quest.xp ?? 0), 0);
  const totalXp = getTotalXp(dailyQuests);
  const rankProgress = getRankProgress(totalXp);
  const streakStats = useMemo(() => getStreakStats(completionHistory), [completionHistory]);
  const nextRewardMilestone = getNextRewardMilestone(streakStats.totalWins);
  const totalQuestCount = dailyQuests.length + sideQuests.length + mainQuests.length;
  const showOnboarding = totalQuestCount === 0 && completionHistory.length === 0;
  const recentHistory = useMemo(
    () =>
      [...completionHistory].sort(
        (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
      ),
    [completionHistory],
  );
  const systemTimestampLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
    [],
  );
  const systemAlertLabel =
    mainQuests.length > 0 ? 'Boss raid detected' : sideQuests.length > 0 ? 'Gate activity detected' : 'Training window stable';

  const activeBattle = useMemo(
    () =>
      selectedBoard
        ? buildBattleState(selectedBoard, dailyQuests, sideQuests, mainQuests)
        : null,
    [dailyQuests, mainQuests, selectedBoard, sideQuests],
  );
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];

  useEffect(() => {
    saveProfilesIndex(activeProfileId, profiles);
  }, [activeProfileId, profiles]);

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
    outcome: QuestHistoryEntry['outcome'] = 'win',
  ) {
    return {
      family,
      questId: quest.id,
      title: quest.title,
      reward: quest.reward,
      outcome,
    } satisfies Omit<QuestHistoryEntry, 'id' | 'completedAt'>;
  }

  function startEditingHistoryEntry(entry: QuestHistoryEntry) {
    setEditingHistoryId(entry.id);
    setEditingHistoryTitle(entry.title);
    setEditingHistoryReward(entry.reward);
    setEditingHistoryCompletedAt(entry.completedAt.slice(0, 16));
    setEditingHistoryOutcome(entry.outcome);
  }

  function cancelEditingHistoryEntry() {
    setEditingHistoryId(null);
  }

  function saveHistoryEntryEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingHistoryId || !editingHistoryTitle.trim() || !editingHistoryReward.trim() || !editingHistoryCompletedAt) {
      return;
    }

    const completedAt = new Date(editingHistoryCompletedAt);

    if (Number.isNaN(completedAt.getTime())) {
      return;
    }

    setCompletionHistory((current) =>
      current.map((entry) =>
        entry.id === editingHistoryId
          ? {
              ...entry,
              title: editingHistoryTitle.trim(),
              reward: editingHistoryReward.trim(),
              completedAt: completedAt.toISOString(),
              outcome: editingHistoryOutcome,
            }
          : entry,
      ),
    );

    cancelEditingHistoryEntry();
  }

  function hasValidDeadline(deadlineType: DeadlineType, deadlineAt: string) {
    return deadlineType !== 'custom' || Boolean(deadlineAt);
  }

  function addDailyQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = dailyTitle.trim();
    const xp = Number(dailyXp);
    const cards = normalizeDraftCards(dailyCards, 3);
    const monsterHp = Number(dailyMonsterHp);

    if (
      !title ||
      Number.isNaN(xp) ||
      xp < 0 ||
      cards.length === 0 ||
      Number.isNaN(monsterHp) ||
      monsterHp < 1 ||
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
        cards,
        monsterName: dailyMonsterMode === 'custom' ? dailyMonsterName.trim() || undefined : undefined,
        monsterArt: dailyMonsterArt.trim() || undefined,
        monsterHp,
        recurrence: dailyRecurrence,
        deadlineType: dailyDeadlineType,
        deadlineAt: normalizeDeadlineAt(dailyDeadlineType, dailyDeadlineAt),
        cycleStartedAt: new Date().toISOString(),
      },
    ]);
    setDailyTitle('');
    setDailyXp('10');
    setDailyCards([createDraftCard('3')]);
    setDailyMonsterMode('auto');
    setDailyMonsterName('');
    setDailyMonsterArt('🗡️');
    setDailyMonsterHp('10');
    setDailyRecurrence('daily');
    setDailyDeadlineType('endOfDay');
    setDailyDeadlineAt('');
  }

  function updateDraftCard(
    cardId: string,
    field: 'title' | 'symbol' | 'cardPower',
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
    const monsterHp = Number(sideMonsterHp);
    const objectives = normalizeDraftCards(sideCards, Math.max(4, Math.ceil((xp || 12) / 2)));

    if (
      !title ||
      !reward ||
      Number.isNaN(xp) ||
      xp < 0 ||
      Number.isNaN(monsterHp) ||
      monsterHp < 1 ||
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
        monsterArt: sideMonsterArt.trim() || undefined,
        monsterHp,
        reward,
        done: false,
        objectives,
        recurrence: sideRecurrence,
        deadlineType: sideDeadlineType,
        deadlineAt: normalizeDeadlineAt(sideDeadlineType, sideDeadlineAt),
        cycleStartedAt: new Date().toISOString(),
      },
    ]);
    setSideTitle('');
    setSideXp('10');
    setSideDifficulty('');
    setSideReward('');
    setSideMonsterMode('auto');
    setSideMonsterName('');
    setSideMonsterArt('🗡️');
    setSideMonsterHp('12');
    setSideCards([createDraftCard('6')]);
    setSideRecurrence('none');
    setSideDeadlineType('none');
    setSideDeadlineAt('');
  }

  function addMainQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = mainTitle.trim();
    const reward = mainReward.trim();
    const monsterHp = Number(mainMonsterHp);
    const objectives = normalizeDraftCards(mainCards, 8);

    if (
      !title ||
      !reward ||
      Number.isNaN(monsterHp) ||
      monsterHp < 1 ||
      objectives.length === 0 ||
      !hasValidDeadline(mainDeadlineType, mainDeadlineAt)
    ) {
      return;
    }

    setMainQuests((current) => [
      ...current,
      {
        id: createId('main'),
        title,
        monsterName: mainMonsterMode === 'custom' ? mainMonsterName.trim() || undefined : undefined,
        monsterArt: mainMonsterArt.trim() || undefined,
        monsterHp,
        reward,
        done: false,
        objectives,
        recurrence: mainRecurrence,
        deadlineType: mainDeadlineType,
        deadlineAt: normalizeDeadlineAt(mainDeadlineType, mainDeadlineAt),
        cycleStartedAt: new Date().toISOString(),
      },
    ]);
    setMainTitle('');
    setMainReward('');
    setMainMonsterMode('auto');
    setMainMonsterName('');
    setMainMonsterArt('🗡️');
    setMainMonsterHp('20');
    setMainCards([createDraftCard('10')]);
    setMainRecurrence('none');
    setMainDeadlineType('none');
    setMainDeadlineAt('');
  }

  function startEditingDailyQuest(quest: DailyQuest) {
    setEditingDailyId(quest.id);
    setEditingDailyTitle(quest.title);
    setEditingDailyXp(String(quest.xp));
    setEditingDailyCards(objectivesToDraftCards(quest.cards));
    setEditingDailyMonsterMode(quest.monsterName ? 'custom' : 'auto');
    setEditingDailyMonsterName(quest.monsterName ?? '');
    setEditingDailyMonsterArt(quest.monsterArt ?? '🗡️');
    setEditingDailyMonsterHp(String(quest.monsterHp ?? quest.cards.reduce((total, card) => total + card.cardPower, 0)));
    setEditingDailyRecurrence(quest.recurrence);
    setEditingDailyDeadlineType(quest.deadlineType);
    setEditingDailyDeadlineAt(quest.deadlineAt ?? '');
  }

  function cancelEditingDailyQuest() {
    setEditingDailyId(null);
  }

  function saveDailyQuestEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDailyId) {
      return;
    }

    const title = editingDailyTitle.trim();
    const xp = Number(editingDailyXp);
    const cards = normalizeDraftCards(editingDailyCards, 3);
    const monsterHp = Number(editingDailyMonsterHp);

    if (
      !title ||
      Number.isNaN(xp) ||
      xp < 0 ||
      cards.length === 0 ||
      Number.isNaN(monsterHp) ||
      monsterHp < 1 ||
      !hasValidDeadline(editingDailyDeadlineType, editingDailyDeadlineAt)
    ) {
      return;
    }

    setDailyQuests((current) =>
      current.map((quest) => {
        if (quest.id !== editingDailyId) {
          return quest;
        }

        const priorPlayedCount = getDailyQuestPlayedCount(quest);
        const nextPlayedCount = Math.min(priorPlayedCount, cards.length);
        return {
          ...quest,
          title,
          xp,
          cards: cards.map((card, index) => ({ ...card, done: index < nextPlayedCount })),
          monsterName: editingDailyMonsterMode === 'custom' ? editingDailyMonsterName.trim() || undefined : undefined,
          monsterArt: editingDailyMonsterArt.trim() || undefined,
          monsterHp,
          recurrence: editingDailyRecurrence,
          deadlineType: editingDailyDeadlineType,
          deadlineAt: normalizeDeadlineAt(editingDailyDeadlineType, editingDailyDeadlineAt),
          completedAt: nextPlayedCount >= cards.length ? quest.completedAt ?? new Date().toISOString() : undefined,
          cycleStartedAt: quest.cycleStartedAt ?? new Date().toISOString(),
        };
      }),
    );

    cancelEditingDailyQuest();
  }

  function startEditingSideQuest(quest: Quest) {
    setEditingSideId(quest.id);
    setEditingSideTitle(quest.title);
    setEditingSideXp(String(quest.xp ?? 0));
    setEditingSideDifficulty(quest.difficulty ?? '');
    setEditingSideReward(quest.reward);
    setEditingSideMonsterMode(quest.monsterName ? 'custom' : 'auto');
    setEditingSideMonsterName(quest.monsterName ?? '');
    setEditingSideMonsterArt(quest.monsterArt ?? '🗡️');
    setEditingSideMonsterHp(String(quest.monsterHp ?? quest.objectives.reduce((total, objective) => total + objective.cardPower, 0)));
    setEditingSideCards(objectivesToDraftCards(quest.objectives));
    setEditingSideRecurrence(quest.recurrence);
    setEditingSideDeadlineType(quest.deadlineType);
    setEditingSideDeadlineAt(quest.deadlineAt ?? '');
  }

  function cancelEditingSideQuest() {
    setEditingSideId(null);
  }

  function saveSideQuestEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingSideId) {
      return;
    }

    const title = editingSideTitle.trim();
    const reward = editingSideReward.trim();
    const xp = Number(editingSideXp);
    const monsterHp = Number(editingSideMonsterHp);
    const objectives = normalizeDraftCards(editingSideCards, Math.max(4, Math.ceil((xp || 12) / 2)));

    if (
      !title ||
      !reward ||
      Number.isNaN(xp) ||
      xp < 0 ||
      Number.isNaN(monsterHp) ||
      monsterHp < 1 ||
      objectives.length === 0 ||
      !hasValidDeadline(editingSideDeadlineType, editingSideDeadlineAt)
    ) {
      return;
    }

    setSideQuests((current) =>
      current.map((quest) =>
        quest.id === editingSideId
          ? (() => {
              const nextObjectives = preserveObjectiveProgress(objectives, quest.objectives);
              const nextDone = nextObjectives.length > 0 && nextObjectives.every((objective) => objective.done);

              return {
                ...quest,
                title,
                xp,
                difficulty: editingSideDifficulty.trim() || 'Custom',
                reward,
                monsterName: editingSideMonsterMode === 'custom' ? editingSideMonsterName.trim() || undefined : undefined,
                monsterArt: editingSideMonsterArt.trim() || undefined,
                monsterHp,
                objectives: nextObjectives,
                done: nextDone,
                completedAt: nextDone ? quest.completedAt ?? new Date().toISOString() : undefined,
                recurrence: editingSideRecurrence,
                deadlineType: editingSideDeadlineType,
                deadlineAt: normalizeDeadlineAt(editingSideDeadlineType, editingSideDeadlineAt),
                cycleStartedAt: quest.cycleStartedAt ?? new Date().toISOString(),
              };
            })()
          : quest,
      ),
    );

    cancelEditingSideQuest();
  }

  function startEditingMainQuest(quest: Quest) {
    setEditingMainId(quest.id);
    setEditingMainTitle(quest.title);
    setEditingMainReward(quest.reward);
    setEditingMainMonsterMode(quest.monsterName ? 'custom' : 'auto');
    setEditingMainMonsterName(quest.monsterName ?? '');
    setEditingMainMonsterArt(quest.monsterArt ?? '🗡️');
    setEditingMainMonsterHp(String(quest.monsterHp ?? quest.objectives.reduce((total, objective) => total + objective.cardPower, 0)));
    setEditingMainCards(objectivesToDraftCards(quest.objectives));
    setEditingMainRecurrence(quest.recurrence);
    setEditingMainDeadlineType(quest.deadlineType);
    setEditingMainDeadlineAt(quest.deadlineAt ?? '');
  }

  function cancelEditingMainQuest() {
    setEditingMainId(null);
  }

  function saveMainQuestEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingMainId) {
      return;
    }

    const title = editingMainTitle.trim();
    const reward = editingMainReward.trim();
    const monsterHp = Number(editingMainMonsterHp);
    const objectives = normalizeDraftCards(editingMainCards, 8);

    if (
      !title ||
      !reward ||
      Number.isNaN(monsterHp) ||
      monsterHp < 1 ||
      objectives.length === 0 ||
      !hasValidDeadline(editingMainDeadlineType, editingMainDeadlineAt)
    ) {
      return;
    }

    setMainQuests((current) =>
      current.map((quest) =>
        quest.id === editingMainId
          ? (() => {
              const nextObjectives = preserveObjectiveProgress(objectives, quest.objectives);
              const nextDone = nextObjectives.length > 0 && nextObjectives.every((objective) => objective.done);

              return {
                ...quest,
                title,
                reward,
                monsterName: editingMainMonsterMode === 'custom' ? editingMainMonsterName.trim() || undefined : undefined,
                monsterArt: editingMainMonsterArt.trim() || undefined,
                monsterHp,
                objectives: nextObjectives,
                done: nextDone,
                completedAt: nextDone ? quest.completedAt ?? new Date().toISOString() : undefined,
                recurrence: editingMainRecurrence,
                deadlineType: editingMainDeadlineType,
                deadlineAt: normalizeDeadlineAt(editingMainDeadlineType, editingMainDeadlineAt),
                cycleStartedAt: quest.cycleStartedAt ?? new Date().toISOString(),
              };
            })()
          : quest,
      ),
    );

    cancelEditingMainQuest();
  }

  function setDailyQuestProgress(questId: string, progressCount: number) {
    const completedAt = new Date().toISOString();
    let historyEntry: Omit<QuestHistoryEntry, 'id' | 'completedAt'> | null = null;

    setDailyQuests((current) =>
      current.map((quest) => {
        if (quest.id !== questId) {
          return quest;
        }

        const nextProgress = clampCount(progressCount, 0, quest.cards.length);
        const nextDone = nextProgress >= quest.cards.length;

        if (!isDailyQuestComplete(quest) && nextDone) {
          historyEntry = {
            family: 'daily',
            questId: quest.id,
            title: quest.title,
            reward: `${quest.xp} XP`,
            outcome: 'win',
          };
        }

        return {
          ...quest,
          cards: quest.cards.map((card, index) => ({ ...card, done: index < nextProgress })),
          completedAt: nextDone ? quest.completedAt ?? completedAt : undefined,
        };
      }),
    );

    if (historyEntry) {
      logQuestCompletion(historyEntry, completedAt);
    }
  }

  function toggleDailyCard(questId: string, cardId: string) {
    const completedAt = new Date().toISOString();
    let historyEntry: Omit<QuestHistoryEntry, 'id' | 'completedAt'> | null = null;

    setDailyQuests((current) =>
      current.map((quest) => {
        if (quest.id !== questId) {
          return quest;
        }

        const cards = quest.cards.map((card) =>
          card.id === cardId ? { ...card, done: !card.done } : card,
        );
        const nextDone = cards.length > 0 && cards.every((card) => card.done);

        if (!isDailyQuestComplete(quest) && nextDone) {
          historyEntry = {
            family: 'daily',
            questId: quest.id,
            title: quest.title,
            reward: `${quest.xp} XP`,
            outcome: 'win',
          };
        }

        return {
          ...quest,
          cards,
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
          if (quest.id !== selectedBoard.questId) {
            return quest;
          }

          const cards = quest.cards.map((card) =>
            card.id === cardId ? { ...card, done: true } : card,
          );
          const nextDone = cards.every((card) => card.done);

          if (!isDailyQuestComplete(quest) && nextDone) {
            historyEntry = {
              family: 'daily',
              questId: quest.id,
              title: quest.title,
              reward: `${quest.xp} XP`,
              outcome: 'win',
            };
          }

          return {
            ...quest,
            cards,
            completedAt: nextDone ? quest.completedAt ?? completedAt : undefined,
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
          quest.id === selectedBoard.questId
            ? {
                ...quest,
                cards: quest.cards.map((card) =>
                  card.id === cardId ? { ...card, done: false } : card,
                ),
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
        current.map((quest) =>
          quest.id === selectedBoard.questId
            ? {
                ...quest,
                completedAt: undefined,
                cards: quest.cards.map((card) => ({ ...card, done: false })),
              }
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

  function toggleSection(section: keyof typeof collapsedSections) {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function switchProfile(profileId: string) {
    const nextState = loadProfileState(profileId);

    setActiveProfileId(profileId);
    setDailyQuests(nextState.dailyQuests);
    setSideQuests(nextState.sideQuests);
    setMainQuests(nextState.mainQuests);
    setCompletionHistory(nextState.completionHistory);
    setSelectedBoard(null);
    setLastPlayedId(null);
    setHitCount(0);
    setEditingDailyId(null);
    setEditingSideId(null);
    setEditingMainId(null);
    setEditingHistoryId(null);
    setProfileStatus(null);
  }

  function addProfile() {
    const name = window.prompt('Name this profile');
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return;
    }

    const profileId = createId('profile');
    const nextState = buildEmptyState();

    setProfiles((current) => [...current, { id: profileId, name: trimmedName }]);
    saveProfileState(profileId, nextState);
    setActiveProfileId(profileId);
    setDailyQuests(nextState.dailyQuests);
    setSideQuests(nextState.sideQuests);
    setMainQuests(nextState.mainQuests);
    setCompletionHistory(nextState.completionHistory);
    setSelectedBoard(null);
    setLastPlayedId(null);
    setHitCount(0);
    setBuilderMode('daily');
    setProfileStatus('Hunter profile created. Initialize a mission or load a hunter pack.');
  }

  function renameProfile() {
    if (!activeProfile) {
      return;
    }

    const name = window.prompt('Rename this profile', activeProfile.name);
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return;
    }

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === activeProfile.id ? { ...profile, name: trimmedName } : profile,
      ),
    );
  }

  function deleteProfile() {
    if (!activeProfile || profiles.length <= 1) {
      return;
    }

    const shouldDelete = window.confirm(`Delete ${activeProfile.name}'s profile and all saved quests on this device?`);

    if (!shouldDelete) {
      return;
    }

    deleteStoredProfile(activeProfile.id);

    const remainingProfiles = profiles.filter((profile) => profile.id !== activeProfile.id);
    const nextProfile = remainingProfiles[0];

    setProfiles(remainingProfiles);
    switchProfile(nextProfile.id);
  }

  function exportActiveProfile() {
    if (!activeProfile) {
      return;
    }

    const payload = serializeProfileBackup(activeProfile, {
      dailyQuests,
      sideQuests,
      mainQuests,
      completionHistory,
    });
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = activeProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';

    anchor.href = url;
    anchor.download = `quest-cat-${safeName}-backup.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setProfileStatus(`Hunter archive exported for ${activeProfile.name}.`);
  }

  async function importProfileBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const imported = parseProfileBackup(raw);
      const profileId = createId('profile');
      const existingNames = new Set(profiles.map((profile) => profile.name));
      let profileName = imported.profileName;
      let suffix = 2;

      while (existingNames.has(profileName)) {
        profileName = `${imported.profileName} ${suffix}`;
        suffix += 1;
      }

      saveProfileState(profileId, imported.state);
      setProfiles((current) => [...current, { id: profileId, name: profileName }]);
      setActiveProfileId(profileId);
      setDailyQuests(imported.state.dailyQuests);
      setSideQuests(imported.state.sideQuests);
      setMainQuests(imported.state.mainQuests);
      setCompletionHistory(imported.state.completionHistory);
      setSelectedBoard(null);
      setLastPlayedId(null);
      setHitCount(0);
      setProfileStatus(`Hunter archive restored as ${profileName}.`);
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : 'Hunter archive import failed.');
    } finally {
      event.target.value = '';
    }
  }

  function addStarterPack() {
    const starterState = buildInitialState();

    setDailyQuests(starterState.dailyQuests);
    setSideQuests(starterState.sideQuests);
    setMainQuests(starterState.mainQuests);
    setCompletionHistory(starterState.completionHistory);
    setProfileStatus('Hunter pack initialized for this profile.');
  }

  function addQuickStartQuest(kind: 'daily' | 'side' | 'main') {
    if (kind === 'daily') {
      setDailyQuests((current) => [...current, createQuickStartDailyQuest()]);
      setBuilderMode('daily');
      setProfileStatus('Quick training mission issued.');
      return;
    }

    if (kind === 'side') {
      setSideQuests((current) => [...current, createQuickStartSideQuest()]);
      setBuilderMode('side');
      setProfileStatus('Quick gate mission issued.');
      return;
    }

    setMainQuests((current) => [...current, createQuickStartMainQuest()]);
    setBuilderMode('main');
    setProfileStatus('Quick boss raid issued.');
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
        <p className="eyebrow">HUNTER SYSTEM</p>
        <h1>Arise</h1>
        <p className="hero-copy">
          Build your hunter routine, clear gates, and push through boss raids with a Solo Leveling-style system UI.
        </p>
        <div className="system-banner" aria-label="Hunter system status">
          <div className="system-banner-chip">
            <span>Active Hunter</span>
            <strong>{activeProfile?.name ?? 'Hunter'}</strong>
          </div>
          <div className="system-banner-chip">
            <span>Timestamp</span>
            <strong>{systemTimestampLabel}</strong>
          </div>
          <div className="system-banner-chip is-alert">
            <span>Alert</span>
            <strong>{systemAlertLabel}</strong>
          </div>
        </div>
        <div className="system-grid" aria-label="Mission summary">
          <article className="system-tile">
            <span>Training</span>
            <strong>{dailyQuests.length}</strong>
            <small>{completedCount} cleared today</small>
          </article>
          <article className="system-tile">
            <span>Gates</span>
            <strong>{sideQuests.length}</strong>
            <small>{completedSideCount} cleared</small>
          </article>
          <article className="system-tile">
            <span>Boss Raids</span>
            <strong>{mainQuests.length}</strong>
            <small>{completedMainCount} conquered</small>
          </article>
        </div>
        <ProfilePanel
          activeProfileId={activeProfileId}
          activeProfileName={activeProfile?.name}
          bestStreak={streakStats.bestStreak}
          currentLevelXp={rankProgress.currentLevelXp}
          currentStreak={streakStats.currentStreak}
          importInputRef={importInputRef}
          level={rankProgress.level}
          nextLevelXp={rankProgress.nextLevelXp}
          nextRewardGoal={nextRewardMilestone.wins}
          nextRewardLabel={nextRewardMilestone.reward}
          onAddProfile={addProfile}
          onDeleteProfile={deleteProfile}
          onExportProfile={exportActiveProfile}
          onImportProfile={importProfileBackup}
          onRenameProfile={renameProfile}
          onSwitchProfile={switchProfile}
          profileStatus={profileStatus}
          profiles={profiles}
          progressPercent={rankProgress.progressPercent}
          rankTitle={rankProgress.rankTitle}
          totalWins={streakStats.totalWins}
        />
      </section>

      {showOnboarding ? (
        <OnboardingCard
          onAddFirstDaily={() => addQuickStartQuest('daily')}
          onAddFirstMainQuest={() => addQuickStartQuest('main')}
          onAddFirstSideQuest={() => addQuickStartQuest('side')}
          onLoadStarterPack={addStarterPack}
        />
      ) : null}

      <section className="section forge-section">
        <div className="section-heading">
          <button className="section-toggle" onClick={() => toggleSection('forge')} type="button">
            <h2>Issue a Mission</h2>
            <span>{collapsedSections.forge ? 'Expand' : 'Collapse'}</span>
          </button>
          <span>Create missions manually or spawn quick hunter templates</span>
        </div>
        {!collapsedSections.forge ? (
          <>
        <div className="quick-start-row">
          <button className="ghost-button" onClick={() => addQuickStartQuest('daily')} type="button">
            Quick Training
          </button>
          <button className="ghost-button" onClick={() => addQuickStartQuest('side')} type="button">
            Quick Gate
          </button>
          <button className="ghost-button" onClick={() => addQuickStartQuest('main')} type="button">
            Quick Raid
          </button>
        </div>
        <div className="builder-toggle-row">
          <button className={`ghost-button ${builderMode === 'daily' ? 'is-selected' : ''}`} onClick={() => setBuilderMode('daily')} type="button">
            Training
          </button>
          <button className={`ghost-button ${builderMode === 'side' ? 'is-selected' : ''}`} onClick={() => setBuilderMode('side')} type="button">
            Gate Run
          </button>
          <button className={`ghost-button ${builderMode === 'main' ? 'is-selected' : ''}`} onClick={() => setBuilderMode('main')} type="button">
            Boss Raid
          </button>
        </div>

        {builderMode === 'daily' ? (
          <form className="quest-form" onSubmit={addDailyQuest}>
            <h3>Create Daily Training</h3>
            <p className="form-note">Build a repeatable training routine with named skills, a target enemy, and either a custom boss name or a generated one.</p>
            <input onChange={(event) => setDailyTitle(event.target.value)} placeholder="Training title" value={dailyTitle} />
            <input min="0" onChange={(event) => setDailyXp(event.target.value)} placeholder="XP reward" type="number" value={dailyXp} />
            <div className="form-grid">
              <input onChange={(event) => setDailyMonsterArt(event.target.value)} placeholder="Enemy look (emoji or image URL)" value={dailyMonsterArt} />
              <input min="1" onChange={(event) => setDailyMonsterHp(event.target.value)} placeholder="Boss HP" type="number" value={dailyMonsterHp} />
            </div>
            <div className="monster-mode-row" role="group" aria-label="Daily monster naming">
              <button
                className={`ghost-button ${dailyMonsterMode === 'auto' ? 'is-selected' : ''}`}
                onClick={() => setDailyMonsterMode('auto')}
                type="button"
              >
                Auto-generate Boss
              </button>
              <button
                className={`ghost-button ${dailyMonsterMode === 'custom' ? 'is-selected' : ''}`}
                onClick={() => setDailyMonsterMode('custom')}
                type="button"
              >
                Name Boss Yourself
              </button>
            </div>
            {dailyMonsterMode === 'custom' ? (
              <input onChange={(event) => setDailyMonsterName(event.target.value)} placeholder="Boss name" value={dailyMonsterName} />
            ) : (
              <p className="form-helper">Boss preview: {autoGenerateMonsterName('daily', dailyTitle || 'daily quest')}</p>
            )}
            <div className="card-builder" aria-label="Daily quest cards">
              {dailyCards.map((card, index) => (
                <div className="card-builder-row" key={card.id}>
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setDailyCards)}
                    placeholder={`Skill ${index + 1} title`}
                    value={card.title}
                  />
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'symbol', event.target.value, setDailyCards)}
                    placeholder="Symbol"
                    value={card.symbol}
                  />
                  <input
                    min="1"
                    onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setDailyCards)}
                    placeholder="Power"
                    type="number"
                    value={card.cardPower}
                  />
                  <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setDailyCards, '3')} type="button">
                    Remove
                  </button>
                </div>
              ))}
              <button className="ghost-button add-card-button" onClick={() => addDraftCard(setDailyCards, '3')} type="button">
                Add Skill
              </button>
            </div>
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
              Create Daily Training
            </button>
          </form>
        ) : null}

        {builderMode === 'side' ? (
          <form className="quest-form" onSubmit={addSideQuest}>
            <h3>Create Gate Mission</h3>
            <p className="form-note">Set a gate reward, add your action list, and decide whether the dungeon boss is custom or generated.</p>
            <input onChange={(event) => setSideTitle(event.target.value)} placeholder="Gate mission title" value={sideTitle} />
            <div className="form-grid">
              <input min="0" onChange={(event) => setSideXp(event.target.value)} placeholder="XP reward" type="number" value={sideXp} />
              <input onChange={(event) => setSideDifficulty(event.target.value)} placeholder="Gate rank" value={sideDifficulty} />
            </div>
            <input onChange={(event) => setSideReward(event.target.value)} placeholder="Reward on clear" value={sideReward} />
            <div className="form-grid">
              <input onChange={(event) => setSideMonsterArt(event.target.value)} placeholder="Boss look (emoji or image URL)" value={sideMonsterArt} />
              <input min="1" onChange={(event) => setSideMonsterHp(event.target.value)} placeholder="Boss HP" type="number" value={sideMonsterHp} />
            </div>
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
                Auto-generate Boss
              </button>
              <button
                className={`ghost-button ${sideMonsterMode === 'custom' ? 'is-selected' : ''}`}
                onClick={() => setSideMonsterMode('custom')}
                type="button"
              >
                Name Boss Yourself
              </button>
            </div>
            {sideMonsterMode === 'custom' ? (
              <input onChange={(event) => setSideMonsterName(event.target.value)} placeholder="Boss name" value={sideMonsterName} />
            ) : (
              <p className="form-helper">Boss preview: {autoGenerateMonsterName('side', sideTitle || 'side quest')}</p>
            )}
            <div className="card-builder" aria-label="Side quest cards">
              {sideCards.map((card, index) => (
                <div className="card-builder-row" key={card.id}>
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setSideCards)}
                    placeholder={`Skill ${index + 1} title`}
                    value={card.title}
                  />
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'symbol', event.target.value, setSideCards)}
                    placeholder="Symbol"
                    value={card.symbol}
                  />
                  <input
                    min="1"
                    onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setSideCards)}
                    placeholder="Power"
                    type="number"
                    value={card.cardPower}
                  />
                  <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setSideCards, '6')} type="button">
                    Remove
                  </button>
                </div>
              ))}
              <button className="ghost-button add-card-button" onClick={() => addDraftCard(setSideCards, '6')} type="button">
                Add Skill
              </button>
            </div>
            <button className="primary-button form-button" type="submit">
              Create Gate Mission
            </button>
          </form>
        ) : null}

        {builderMode === 'main' ? (
          <form className="quest-form" onSubmit={addMainQuest}>
            <h3>Create Boss Raid</h3>
            <p className="form-note">Set up a major raid target with a completion reward and a full hunter loadout.</p>
            <input onChange={(event) => setMainTitle(event.target.value)} placeholder="Boss raid title" value={mainTitle} />
            <input onChange={(event) => setMainReward(event.target.value)} placeholder="Reward on clear" value={mainReward} />
            <div className="form-grid">
              <input onChange={(event) => setMainMonsterArt(event.target.value)} placeholder="Boss look (emoji or image URL)" value={mainMonsterArt} />
              <input min="1" onChange={(event) => setMainMonsterHp(event.target.value)} placeholder="Boss HP" type="number" value={mainMonsterHp} />
            </div>
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
                Auto-generate Boss
              </button>
              <button
                className={`ghost-button ${mainMonsterMode === 'custom' ? 'is-selected' : ''}`}
                onClick={() => setMainMonsterMode('custom')}
                type="button"
              >
                Name Boss Yourself
              </button>
            </div>
            {mainMonsterMode === 'custom' ? (
              <input onChange={(event) => setMainMonsterName(event.target.value)} placeholder="Boss name" value={mainMonsterName} />
            ) : (
              <p className="form-helper">Boss preview: {autoGenerateMonsterName('main', mainTitle || 'main quest')}</p>
            )}
            <div className="card-builder" aria-label="Main quest cards">
              {mainCards.map((card, index) => (
                <div className="card-builder-row" key={card.id}>
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setMainCards)}
                    placeholder={`Skill ${index + 1} title`}
                    value={card.title}
                  />
                  <input
                    onChange={(event) => updateDraftCard(card.id, 'symbol', event.target.value, setMainCards)}
                    placeholder="Symbol"
                    value={card.symbol}
                  />
                  <input
                    min="1"
                    onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setMainCards)}
                    placeholder="Power"
                    type="number"
                    value={card.cardPower}
                  />
                  <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setMainCards, '10')} type="button">
                    Remove
                  </button>
                </div>
              ))}
              <button className="ghost-button add-card-button" onClick={() => addDraftCard(setMainCards, '10')} type="button">
                Add Skill
              </button>
            </div>
            <button className="primary-button form-button" type="submit">
              Create Boss Raid
            </button>
          </form>
        ) : null}
          </>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <button className="section-toggle" onClick={() => toggleSection('daily')} type="button">
            <h2>Daily Training</h2>
            <span>{collapsedSections.daily ? 'Expand' : 'Collapse'}</span>
          </button>
          <span>
            {completedCount} of {dailyQuests.length} trainings cleared
          </span>
        </div>
        {!collapsedSections.daily ? (
        <div className="card-stack">
          {dailyQuests.map((quest) => (
            <article className="game-card list-card deck-card" key={quest.id}>
              <div className="battle-card-topline">
                <span className="battle-card-type">training</span>
                <span className="battle-stat-chip">{quest.cards.reduce((total, card) => total + card.cardPower, 0)} dmg</span>
              </div>
              <div className="deck-card-body">
                <div className="deck-card-copy">
                  <strong>{quest.title}</strong>
                  <small className="deck-card-meta">
                    {quest.cards.length} skills
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
                <button className="ghost-button" onClick={() => setDailyQuestProgress(quest.id, getDailyQuestPlayedCount(quest) - 1)} type="button">
                  -
                </button>
                <span>{getDailyQuestPlayedCount(quest)}</span>
                <button className="ghost-button" onClick={() => setDailyQuestProgress(quest.id, getDailyQuestPlayedCount(quest) + 1)} type="button">
                  +
                </button>
              </div>
              {editingDailyId === quest.id ? (
                <form className="quest-form edit-form" onSubmit={saveDailyQuestEdit}>
                  <h3>Edit Training Skills</h3>
                  <p className="form-note">Edit skill names below. You can also add more skills or change the rest of the training setup here.</p>
                  <input onChange={(event) => setEditingDailyTitle(event.target.value)} placeholder="Training title" value={editingDailyTitle} />
                  <input min="0" onChange={(event) => setEditingDailyXp(event.target.value)} placeholder="XP reward" type="number" value={editingDailyXp} />
                  <div className="form-grid">
                    <input onChange={(event) => setEditingDailyMonsterArt(event.target.value)} placeholder="Boss look (emoji or image URL)" value={editingDailyMonsterArt} />
                    <input min="1" onChange={(event) => setEditingDailyMonsterHp(event.target.value)} placeholder="Boss HP" type="number" value={editingDailyMonsterHp} />
                  </div>
                  <div className="monster-mode-row" role="group" aria-label="Edit daily monster naming">
                    <button
                      className={`ghost-button ${editingDailyMonsterMode === 'auto' ? 'is-selected' : ''}`}
                      onClick={() => setEditingDailyMonsterMode('auto')}
                      type="button"
                    >
                      Auto-generate Boss
                    </button>
                    <button
                      className={`ghost-button ${editingDailyMonsterMode === 'custom' ? 'is-selected' : ''}`}
                      onClick={() => setEditingDailyMonsterMode('custom')}
                      type="button"
                    >
                      Name Boss Yourself
                    </button>
                  </div>
                  {editingDailyMonsterMode === 'custom' ? (
                    <input onChange={(event) => setEditingDailyMonsterName(event.target.value)} placeholder="Boss name" value={editingDailyMonsterName} />
                  ) : (
                    <p className="form-helper">Boss preview: {autoGenerateMonsterName('daily', editingDailyTitle || 'daily quest')}</p>
                  )}
                  <div className="card-builder" aria-label="Edit daily quest cards">
                    {editingDailyCards.map((card, index) => (
                      <div className="card-builder-row" key={card.id}>
                        <input
                          onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setEditingDailyCards)}
                          placeholder={`Skill ${index + 1} title`}
                          value={card.title}
                        />
                        <input
                          onChange={(event) => updateDraftCard(card.id, 'symbol', event.target.value, setEditingDailyCards)}
                          placeholder="Symbol"
                          value={card.symbol}
                        />
                        <input
                          min="1"
                          onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setEditingDailyCards)}
                          placeholder="Power"
                          type="number"
                          value={card.cardPower}
                        />
                        <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setEditingDailyCards, '3')} type="button">
                          Remove
                        </button>
                      </div>
                    ))}
                    <button className="ghost-button add-card-button" onClick={() => addDraftCard(setEditingDailyCards, '3')} type="button">
                      Add Another Skill
                    </button>
                  </div>
                  <div className="form-grid">
                    <select onChange={(event) => setEditingDailyRecurrence(event.target.value as Recurrence)} value={editingDailyRecurrence}>
                      {recurrenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select onChange={(event) => setEditingDailyDeadlineType(event.target.value as DeadlineType)} value={editingDailyDeadlineType}>
                      {deadlineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editingDailyDeadlineType === 'custom' ? (
                    <input onChange={(event) => setEditingDailyDeadlineAt(event.target.value)} type="date" value={editingDailyDeadlineAt} />
                  ) : null}
                  <div className="edit-form-actions">
                    <button className="ghost-button" onClick={cancelEditingDailyQuest} type="button">
                      Cancel
                    </button>
                    <button className="primary-button compact-primary-button" type="submit">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : null}
              <div className="card-actions">
                <button className="ghost-button" onClick={() => setSelectedBoard({ kind: 'daily', questId: quest.id })} type="button">
                  Enter Raid
                </button>
                <button className="ghost-button card-rename-button" onClick={() => startEditingDailyQuest(quest)} type="button">
                  Edit Skills
                </button>
                <button className="ghost-button danger-button" onClick={() => deleteDailyQuest(quest.id)} type="button">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
        ) : null}

      </section>

      <section className="section">
        <div className="section-heading">
          <button className="section-toggle" onClick={() => toggleSection('side')} type="button">
            <h2>Gate Missions</h2>
            <span>{collapsedSections.side ? 'Expand' : 'Collapse'}</span>
          </button>
          <span>Worth {sideQuestXp} bonus XP</span>
        </div>
        {!collapsedSections.side ? (
        <div className="card-stack">
          {sideQuests.map((quest) => {
            const completion = getQuestCompletion(quest);

            return (
              <article className="game-card list-card deck-card" key={quest.id}>
                <div className="battle-card-topline">
                  <span className="battle-card-type">gate</span>
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
                    <p className="reward-pill">Clear reward: {quest.reward}</p>
                  </div>
                </div>
                {editingSideId === quest.id ? (
                  <form className="quest-form edit-form" onSubmit={saveSideQuestEdit}>
                    <h3>Edit Gate Skills</h3>
                    <p className="form-note">Edit skill names below. You can also add more skills or change the rest of the mission setup here without losing progress.</p>
                    <input onChange={(event) => setEditingSideTitle(event.target.value)} placeholder="Gate mission title" value={editingSideTitle} />
                    <div className="form-grid">
                      <input min="0" onChange={(event) => setEditingSideXp(event.target.value)} placeholder="XP reward" type="number" value={editingSideXp} />
                      <input onChange={(event) => setEditingSideDifficulty(event.target.value)} placeholder="Gate rank" value={editingSideDifficulty} />
                    </div>
                    <input onChange={(event) => setEditingSideReward(event.target.value)} placeholder="Reward on clear" value={editingSideReward} />
                    <div className="form-grid">
                      <input onChange={(event) => setEditingSideMonsterArt(event.target.value)} placeholder="Boss look (emoji or image URL)" value={editingSideMonsterArt} />
                      <input min="1" onChange={(event) => setEditingSideMonsterHp(event.target.value)} placeholder="Boss HP" type="number" value={editingSideMonsterHp} />
                    </div>
                    <div className="form-grid">
                      <select onChange={(event) => setEditingSideRecurrence(event.target.value as Recurrence)} value={editingSideRecurrence}>
                        {recurrenceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select onChange={(event) => setEditingSideDeadlineType(event.target.value as DeadlineType)} value={editingSideDeadlineType}>
                        {deadlineOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {editingSideDeadlineType === 'custom' ? (
                      <input onChange={(event) => setEditingSideDeadlineAt(event.target.value)} type="date" value={editingSideDeadlineAt} />
                    ) : null}
                    <div className="monster-mode-row" role="group" aria-label="Edit side monster naming">
                      <button
                        className={`ghost-button ${editingSideMonsterMode === 'auto' ? 'is-selected' : ''}`}
                        onClick={() => setEditingSideMonsterMode('auto')}
                        type="button"
                      >
                        Auto-generate Boss
                      </button>
                      <button
                        className={`ghost-button ${editingSideMonsterMode === 'custom' ? 'is-selected' : ''}`}
                        onClick={() => setEditingSideMonsterMode('custom')}
                        type="button"
                      >
                        Name Boss Yourself
                      </button>
                    </div>
                    {editingSideMonsterMode === 'custom' ? (
                      <input onChange={(event) => setEditingSideMonsterName(event.target.value)} placeholder="Boss name" value={editingSideMonsterName} />
                    ) : (
                      <p className="form-helper">Boss preview: {autoGenerateMonsterName('side', editingSideTitle || 'side quest')}</p>
                    )}
                    <div className="card-builder" aria-label="Edit side quest cards">
                      {editingSideCards.map((card, index) => (
                        <div className="card-builder-row" key={card.id}>
                          <input
                            onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setEditingSideCards)}
                            placeholder={`Skill ${index + 1} title`}
                            value={card.title}
                          />
                          <input
                            onChange={(event) => updateDraftCard(card.id, 'symbol', event.target.value, setEditingSideCards)}
                            placeholder="Symbol"
                            value={card.symbol}
                          />
                          <input
                            min="1"
                            onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setEditingSideCards)}
                            placeholder="Power"
                            type="number"
                            value={card.cardPower}
                          />
                          <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setEditingSideCards, '6')} type="button">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button className="ghost-button add-card-button" onClick={() => addDraftCard(setEditingSideCards, '6')} type="button">
                        Add Another Skill
                      </button>
                    </div>
                    <div className="edit-form-actions">
                      <button className="ghost-button" onClick={cancelEditingSideQuest} type="button">
                        Cancel
                      </button>
                      <button className="primary-button compact-primary-button" type="submit">
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : null}
                <div className="card-actions">
                  <button className="ghost-button" onClick={() => setSelectedBoard({ kind: 'side', questId: quest.id })} type="button">
                    Enter Raid
                  </button>
                  <button className="ghost-button card-rename-button" onClick={() => startEditingSideQuest(quest)} type="button">
                    Edit Skills
                  </button>
                  <button className="ghost-button danger-button" onClick={() => deleteQuest(quest.id, 'side', setSideQuests)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        ) : null}

      </section>

      <section className="section">
        <div className="section-heading">
          <button className="section-toggle" onClick={() => toggleSection('main')} type="button">
            <h2>Boss Raids</h2>
            <span>{collapsedSections.main ? 'Expand' : 'Collapse'}</span>
          </button>
          <span>Major raid encounters</span>
        </div>
        {!collapsedSections.main ? (
        <div className="card-stack">
          {mainQuests.map((quest) => {
            const completion = getQuestCompletion(quest);

            return (
              <article className="game-card list-card deck-card" key={quest.id}>
                <div className="battle-card-topline">
                  <span className="battle-card-type">raid</span>
                  <span className="battle-stat-chip">{completion.objectiveCount} skills</span>
                </div>
                <div className="deck-card-body">
                  <div className="deck-card-copy">
                    <strong>{quest.title}</strong>
                    <small className="deck-card-meta">{completion.progressLabel}</small>
                    <small className="quest-rule-copy">
                      {formatRecurrence(quest.recurrence)} <span aria-hidden="true">·</span> {formatDeadline(quest.deadlineType, quest.deadlineAt)}
                    </small>
                    <p className="reward-pill">Clear reward: {quest.reward}</p>
                  </div>
                </div>
                {editingMainId === quest.id ? (
                  <form className="quest-form edit-form" onSubmit={saveMainQuestEdit}>
                    <h3>Edit Raid Skills</h3>
                    <p className="form-note">Edit skill names below. You can also add more skills or change the rest of the raid setup here without losing progress.</p>
                    <input onChange={(event) => setEditingMainTitle(event.target.value)} placeholder="Boss raid title" value={editingMainTitle} />
                    <input onChange={(event) => setEditingMainReward(event.target.value)} placeholder="Reward on clear" value={editingMainReward} />
                    <div className="form-grid">
                      <input onChange={(event) => setEditingMainMonsterArt(event.target.value)} placeholder="Boss look (emoji or image URL)" value={editingMainMonsterArt} />
                      <input min="1" onChange={(event) => setEditingMainMonsterHp(event.target.value)} placeholder="Boss HP" type="number" value={editingMainMonsterHp} />
                    </div>
                    <div className="form-grid">
                      <select onChange={(event) => setEditingMainRecurrence(event.target.value as Recurrence)} value={editingMainRecurrence}>
                        {recurrenceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select onChange={(event) => setEditingMainDeadlineType(event.target.value as DeadlineType)} value={editingMainDeadlineType}>
                        {deadlineOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {editingMainDeadlineType === 'custom' ? (
                      <input onChange={(event) => setEditingMainDeadlineAt(event.target.value)} type="date" value={editingMainDeadlineAt} />
                    ) : null}
                    <div className="monster-mode-row" role="group" aria-label="Edit main monster naming">
                      <button
                        className={`ghost-button ${editingMainMonsterMode === 'auto' ? 'is-selected' : ''}`}
                        onClick={() => setEditingMainMonsterMode('auto')}
                        type="button"
                      >
                        Auto-generate Boss
                      </button>
                      <button
                        className={`ghost-button ${editingMainMonsterMode === 'custom' ? 'is-selected' : ''}`}
                        onClick={() => setEditingMainMonsterMode('custom')}
                        type="button"
                      >
                        Name Boss Yourself
                      </button>
                    </div>
                    {editingMainMonsterMode === 'custom' ? (
                      <input onChange={(event) => setEditingMainMonsterName(event.target.value)} placeholder="Boss name" value={editingMainMonsterName} />
                    ) : (
                      <p className="form-helper">Boss preview: {autoGenerateMonsterName('main', editingMainTitle || 'main quest')}</p>
                    )}
                    <div className="card-builder" aria-label="Edit main quest cards">
                      {editingMainCards.map((card, index) => (
                        <div className="card-builder-row" key={card.id}>
                          <input
                            onChange={(event) => updateDraftCard(card.id, 'title', event.target.value, setEditingMainCards)}
                            placeholder={`Skill ${index + 1} title`}
                            value={card.title}
                          />
                          <input
                            onChange={(event) => updateDraftCard(card.id, 'symbol', event.target.value, setEditingMainCards)}
                            placeholder="Symbol"
                            value={card.symbol}
                          />
                          <input
                            min="1"
                            onChange={(event) => updateDraftCard(card.id, 'cardPower', event.target.value, setEditingMainCards)}
                            placeholder="Power"
                            type="number"
                            value={card.cardPower}
                          />
                          <button className="ghost-button card-row-button" onClick={() => removeDraftCard(card.id, setEditingMainCards, '10')} type="button">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button className="ghost-button add-card-button" onClick={() => addDraftCard(setEditingMainCards, '10')} type="button">
                        Add Another Skill
                      </button>
                    </div>
                    <div className="edit-form-actions">
                      <button className="ghost-button" onClick={cancelEditingMainQuest} type="button">
                        Cancel
                      </button>
                      <button className="primary-button compact-primary-button" type="submit">
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : null}
                <div className="card-actions">
                  <button className="ghost-button" onClick={() => setSelectedBoard({ kind: 'main', questId: quest.id })} type="button">
                    Enter Raid
                  </button>
                  <button className="ghost-button card-rename-button" onClick={() => startEditingMainQuest(quest)} type="button">
                    Edit Skills
                  </button>
                  <button className="ghost-button danger-button" onClick={() => deleteQuest(quest.id, 'main', setMainQuests)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        ) : null}

      </section>

      <section className="section">
        <div className="section-heading">
          <button className="section-toggle" onClick={() => toggleSection('history')} type="button">
            <h2>Raid Archive</h2>
            <span>{collapsedSections.history ? 'Expand' : 'Collapse'}</span>
          </button>
          <span>{recentHistory.length} entries logged</span>
        </div>
        {!collapsedSections.history ? (
        <div className="card-stack">
          {recentHistory.length === 0 ? (
            <article className="game-card list-card history-card">
              <strong>No raid records yet</strong>
              <small>When you clear or fail a mission, the result and date will be logged here.</small>
            </article>
          ) : (
            recentHistory.map((entry) => (
              <article className="game-card list-card history-card" key={entry.id}>
                <div className="battle-card-topline">
                  <span className="battle-card-type">{entry.family} {entry.outcome}</span>
                  <span className={`battle-stat-chip ${entry.outcome === 'loss' ? 'is-loss-chip' : 'is-win-chip'}`}>
                    {entry.outcome}
                  </span>
                </div>
                <div className="deck-card-copy">
                  <strong>{entry.title}</strong>
                  <small>{new Date(entry.completedAt).toLocaleString()}</small>
                  <p className="reward-pill">Reward: {entry.reward}</p>
                </div>
                {editingHistoryId === entry.id ? (
                  <form className="quest-form edit-form" onSubmit={saveHistoryEntryEdit}>
                    <h3>Edit Raid Record</h3>
                    <input onChange={(event) => setEditingHistoryTitle(event.target.value)} placeholder="Mission title" value={editingHistoryTitle} />
                    <input onChange={(event) => setEditingHistoryReward(event.target.value)} placeholder="Reward" value={editingHistoryReward} />
                    <div className="form-grid">
                      <input
                        onChange={(event) => setEditingHistoryCompletedAt(event.target.value)}
                        type="datetime-local"
                        value={editingHistoryCompletedAt}
                      />
                      <select
                        onChange={(event) => setEditingHistoryOutcome(event.target.value as 'win' | 'loss')}
                        value={editingHistoryOutcome}
                      >
                        <option value="win">Win</option>
                        <option value="loss">Loss</option>
                      </select>
                    </div>
                    <div className="edit-form-actions">
                      <button className="ghost-button" onClick={cancelEditingHistoryEntry} type="button">
                        Cancel
                      </button>
                      <button className="primary-button compact-primary-button" type="submit">
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : null}
                <div className="card-actions">
                  <button className="ghost-button" onClick={() => startEditingHistoryEntry(entry)} type="button">
                    Edit Record
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        ) : null}
      </section>

    </main>
  );
}
