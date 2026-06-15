export type Recurrence = 'none' | 'daily' | 'weekly';
export type DeadlineType = 'none' | 'endOfDay' | 'endOfWeek' | 'custom';

export type QuestHistoryEntry = {
  id: string;
  family: 'daily' | 'side' | 'main';
  questId: string;
  title: string;
  reward: string;
  completedAt: string;
  outcome: 'win' | 'loss';
};

export type Objective = {
  id: string;
  title: string;
  symbol?: string;
  cardPower: number;
  done: boolean;
};

export type DailyQuest = {
  id: string;
  title: string;
  xp: number;
  cards: Objective[];
  monsterName?: string;
  monsterArt?: string;
  monsterHp?: number;
  recurrence: Recurrence;
  deadlineType: DeadlineType;
  deadlineAt?: string;
  completedAt?: string;
  cycleStartedAt?: string;
};

export type DraftCard = {
  id: string;
  title: string;
  symbol: string;
  cardPower: string;
};

export type Quest = {
  id: string;
  title: string;
  xp?: number;
  difficulty?: string;
  monsterName?: string;
  monsterArt?: string;
  monsterHp?: number;
  reward: string;
  done: boolean;
  objectives: Objective[];
  recurrence: Recurrence;
  deadlineType: DeadlineType;
  deadlineAt?: string;
  completedAt?: string;
  cycleStartedAt?: string;
};

export type BoardSelection =
  | { kind: 'daily'; questId: string }
  | { kind: 'side'; questId: string }
  | { kind: 'main'; questId: string };

export type AppState = {
  dailyQuests: DailyQuest[];
  sideQuests: Quest[];
  mainQuests: Quest[];
  completionHistory: QuestHistoryEntry[];
};

export type ProfileSummary = {
  id: string;
  name: string;
};

export type ProfilesIndex = {
  activeProfileId: string;
  profiles: ProfileSummary[];
};

export type LoadedProfiles = {
  index: ProfilesIndex;
  initialProfileId: string;
  initialState: AppState;
};

export type BattleCard = {
  id: string;
  originId: string;
  title: string;
  symbol: string;
  cardPower: number;
  played: boolean;
  flavor: string;
  family: 'daily' | 'side' | 'main';
};

export type BattleState = {
  title: string;
  subtitle: string;
  monsterName: string;
  monsterArt: string;
  monsterMood: string;
  totalHp: number;
  currentHp: number;
  cards: BattleCard[];
};

export type ProfileBackup = {
  version: 1;
  exportedAt: string;
  profile: {
    id: string;
    name: string;
  };
  state: AppState;
};
