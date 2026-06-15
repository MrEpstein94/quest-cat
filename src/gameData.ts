import type { DailyQuest, DeadlineType, Quest, Recurrence } from './types';

export const DEFAULT_PROFILE_ID = 'profile-default';
export const DEFAULT_PROFILE_NAME = 'Player 1';

export const rankTitles = [
  'Tiny Paws',
  'Alley Scout',
  'Whisker Squire',
  'Moonlight Hunter',
  'Legend Cat',
];

export const baseXp = 180;

export const recurrenceOptions: Array<{ value: Recurrence; label: string }> = [
  { value: 'none', label: 'No recurrence' },
  { value: 'daily', label: 'Repeats daily' },
  { value: 'weekly', label: 'Repeats weekly' },
];

export const deadlineOptions: Array<{ value: DeadlineType; label: string }> = [
  { value: 'none', label: 'No time limit' },
  { value: 'endOfDay', label: 'End of day' },
  { value: 'endOfWeek', label: 'End of week' },
  { value: 'custom', label: 'Custom date' },
];

export const defaultDailyQuests: DailyQuest[] = [
  {
    id: 'daily-1',
    title: 'Drink water',
    xp: 10,
    cards: [
      { id: 'daily-1-card-1', title: 'Morning glass', symbol: '💧', cardPower: 3, done: true },
      { id: 'daily-1-card-2', title: 'Lunch refill', symbol: '🥤', cardPower: 3, done: true },
      { id: 'daily-1-card-3', title: 'Afternoon glass', symbol: '💦', cardPower: 3, done: false },
      { id: 'daily-1-card-4', title: 'Dinner refill', symbol: '🫗', cardPower: 3, done: false },
      { id: 'daily-1-card-5', title: 'Night glass', symbol: '🌊', cardPower: 3, done: false },
    ],
    monsterArt: '🗡️',
    monsterHp: 15,
    recurrence: 'daily',
    deadlineType: 'endOfDay',
  },
  {
    id: 'daily-2',
    title: 'Shower',
    xp: 15,
    cards: [{ id: 'daily-2-card-1', title: 'Take shower', symbol: '🚿', cardPower: 8, done: false }],
    monsterArt: '🗡️',
    monsterHp: 8,
    recurrence: 'daily',
    deadlineType: 'endOfDay',
  },
  {
    id: 'daily-3',
    title: 'Brush teeth',
    xp: 12,
    cards: [
      { id: 'daily-3-card-1', title: 'Brush in morning', symbol: '🪥', cardPower: 4, done: true },
      { id: 'daily-3-card-2', title: 'Brush at night', symbol: '✨', cardPower: 4, done: false },
    ],
    monsterArt: '🗡️',
    monsterHp: 8,
    recurrence: 'daily',
    deadlineType: 'endOfDay',
  },
  {
    id: 'daily-4',
    title: '30 minute workout',
    xp: 35,
    cards: [{ id: 'daily-4-card-1', title: 'Workout session', symbol: '💪', cardPower: 12, done: false }],
    monsterArt: '🗡️',
    monsterHp: 12,
    recurrence: 'daily',
    deadlineType: 'endOfDay',
  },
];

export const defaultSideQuests: Quest[] = [
  {
    id: 'side-1',
    title: 'Reply to one lingering text',
    xp: 8,
    difficulty: 'Quick win',
    reward: '15 minutes guilt-free scrolling',
    monsterArt: '🗡️',
    monsterHp: 15,
    done: false,
    recurrence: 'none',
    deadlineType: 'none',
    objectives: [
      { id: 'side-1-1', title: 'Pick one person', symbol: '🎯', cardPower: 4, done: false },
      { id: 'side-1-2', title: 'Send the message', symbol: '💬', cardPower: 5, done: false },
      { id: 'side-1-3', title: 'Archive the thread', symbol: '📦', cardPower: 6, done: false },
    ],
  },
  {
    id: 'side-2',
    title: 'Tidy one small surface',
    xp: 12,
    difficulty: 'Easy',
    reward: 'Fresh coffee after cleanup',
    monsterArt: '🗡️',
    monsterHp: 15,
    done: false,
    recurrence: 'none',
    deadlineType: 'none',
    objectives: [
      { id: 'side-2-1', title: 'Choose one desk or counter', symbol: '📍', cardPower: 4, done: false },
      { id: 'side-2-2', title: 'Throw away trash', symbol: '🗑️', cardPower: 5, done: false },
      { id: 'side-2-3', title: 'Put items back', symbol: '📚', cardPower: 6, done: false },
    ],
  },
  {
    id: 'side-3',
    title: 'Read 10 pages',
    xp: 18,
    difficulty: 'Medium',
    reward: 'New sticker unlock',
    monsterArt: '🗡️',
    monsterHp: 21,
    done: false,
    recurrence: 'none',
    deadlineType: 'none',
    objectives: [
      { id: 'side-3-1', title: 'Set a 15-minute timer', symbol: '⏱️', cardPower: 6, done: false },
      { id: 'side-3-2', title: 'Read without phone', symbol: '📖', cardPower: 7, done: false },
      { id: 'side-3-3', title: 'Log one takeaway', symbol: '📝', cardPower: 8, done: false },
    ],
  },
];

export const defaultMainQuests: Quest[] = [
  {
    id: 'main-1',
    title: 'Hit a 5-day streak',
    reward: 'Weekend cafe visit',
    monsterArt: '🗡️',
    monsterHp: 18,
    done: false,
    recurrence: 'weekly',
    deadlineType: 'endOfWeek',
    objectives: [
      { id: 'main-1-1', title: 'Finish 3 daily quests each day', symbol: '🔥', cardPower: 8, done: false },
      { id: 'main-1-2', title: 'Keep the streak alive tonight', symbol: '🌙', cardPower: 10, done: false },
    ],
  },
  {
    id: 'main-2',
    title: 'Launch Quest Cat v1',
    reward: 'Buy a custom cat icon pack',
    monsterArt: '🗡️',
    monsterHp: 28,
    done: false,
    recurrence: 'none',
    deadlineType: 'none',
    objectives: [
      { id: 'main-2-1', title: 'Finish quest list layout', symbol: '🧩', cardPower: 8, done: false },
      { id: 'main-2-2', title: 'Define reward system', symbol: '🎁', cardPower: 9, done: false },
      { id: 'main-2-3', title: 'Ship first installable build', symbol: '🚀', cardPower: 11, done: false },
    ],
  },
];
