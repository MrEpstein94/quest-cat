import { DEFAULT_PROFILE_ID, DEFAULT_PROFILE_NAME } from './gameData';
import {
  buildInitialState,
  migrateLegacyCycleStartedAt,
  normalizeDailyQuest,
  normalizeHistoryEntry,
  normalizeQuest,
} from './questDomain';
import type { AppState, LoadedProfiles, ProfileBackup, ProfileSummary, ProfilesIndex } from './types';

const STORAGE_KEY = 'quest-cat-state-v8';
const PROFILE_INDEX_KEY = 'quest-cat-profiles-v1';
const PROFILE_STATE_PREFIX = 'quest-cat-profile-state-v1:';

export function getProfileStateKey(profileId: string) {
  return `${PROFILE_STATE_PREFIX}${profileId}`;
}

function parseStoredAppState(savedState: string, sourceStorageKey: string | null) {
  try {
    const parsedState = JSON.parse(savedState) as Partial<AppState>;

    return {
      dailyQuests: Array.isArray(parsedState.dailyQuests)
        ? parsedState.dailyQuests
            .map((quest) => normalizeDailyQuest(quest))
            .map((quest) => migrateLegacyCycleStartedAt(quest, sourceStorageKey))
        : buildInitialState().dailyQuests,
      sideQuests: Array.isArray(parsedState.sideQuests)
        ? parsedState.sideQuests
            .map((quest) => normalizeQuest(quest))
            .map((quest) => migrateLegacyCycleStartedAt(quest, sourceStorageKey))
        : buildInitialState().sideQuests,
      mainQuests: Array.isArray(parsedState.mainQuests)
        ? parsedState.mainQuests
            .map((quest) => normalizeQuest(quest))
            .map((quest) => migrateLegacyCycleStartedAt(quest, sourceStorageKey))
        : buildInitialState().mainQuests,
      completionHistory: Array.isArray(parsedState.completionHistory)
        ? parsedState.completionHistory.map((entry) => normalizeHistoryEntry(entry))
        : [],
    } satisfies AppState;
  } catch {
    return buildInitialState();
  }
}

function loadLegacyState() {
  if (typeof window === 'undefined') {
    return buildInitialState();
  }

  const storageKeys = [
    STORAGE_KEY,
    'quest-cat-state-v7',
    'quest-cat-state-v6',
    'quest-cat-state-v5',
    'quest-cat-state-v3',
    'quest-cat-state-v2',
    'quest-cat-state-v1',
  ];
  const sourceStorageKey = storageKeys.find((key) => window.localStorage.getItem(key) !== null) ?? null;
  const savedState = sourceStorageKey ? window.localStorage.getItem(sourceStorageKey) : null;

  if (!savedState) {
    return buildInitialState();
  }

  return parseStoredAppState(savedState, sourceStorageKey);
}

export function loadProfileState(profileId: string) {
  if (typeof window === 'undefined') {
    return buildInitialState();
  }

  const savedState = window.localStorage.getItem(getProfileStateKey(profileId));

  if (!savedState) {
    return buildInitialState();
  }

  return parseStoredAppState(savedState, getProfileStateKey(profileId));
}

function normalizeProfilesIndex(value: unknown): ProfilesIndex | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsed = value as Partial<ProfilesIndex>;
  const profiles = Array.isArray(parsed.profiles)
    ? parsed.profiles
        .filter((profile): profile is ProfileSummary => {
          return (
            Boolean(profile) &&
            typeof profile === 'object' &&
            typeof (profile as ProfileSummary).id === 'string' &&
            typeof (profile as ProfileSummary).name === 'string' &&
            (profile as ProfileSummary).id.trim().length > 0 &&
            (profile as ProfileSummary).name.trim().length > 0
          );
        })
        .map((profile) => ({
          id: profile.id.trim(),
          name: profile.name.trim(),
        }))
    : [];

  if (profiles.length === 0) {
    return null;
  }

  const activeProfileId =
    typeof parsed.activeProfileId === 'string' && profiles.some((profile) => profile.id === parsed.activeProfileId)
      ? parsed.activeProfileId
      : profiles[0].id;

  return { activeProfileId, profiles };
}

export function loadProfiles(): LoadedProfiles {
  if (typeof window === 'undefined') {
    return {
      index: {
        activeProfileId: DEFAULT_PROFILE_ID,
        profiles: [{ id: DEFAULT_PROFILE_ID, name: DEFAULT_PROFILE_NAME }],
      },
      initialProfileId: DEFAULT_PROFILE_ID,
      initialState: buildInitialState(),
    };
  }

  const savedIndex = window.localStorage.getItem(PROFILE_INDEX_KEY);

  if (savedIndex) {
    try {
      const parsedIndex = normalizeProfilesIndex(JSON.parse(savedIndex));

      if (parsedIndex) {
        return {
          index: parsedIndex,
          initialProfileId: parsedIndex.activeProfileId,
          initialState: loadProfileState(parsedIndex.activeProfileId),
        };
      }
    } catch {
      // Fall back to legacy single-profile state below.
    }
  }

  return {
    index: {
      activeProfileId: DEFAULT_PROFILE_ID,
      profiles: [{ id: DEFAULT_PROFILE_ID, name: DEFAULT_PROFILE_NAME }],
    },
    initialProfileId: DEFAULT_PROFILE_ID,
    initialState: loadLegacyState(),
  };
}

export function saveProfilesIndex(activeProfileId: string, profiles: ProfileSummary[]) {
  window.localStorage.setItem(
    PROFILE_INDEX_KEY,
    JSON.stringify({
      activeProfileId,
      profiles,
    } satisfies ProfilesIndex),
  );
}

export function saveProfileState(profileId: string, state: AppState) {
  window.localStorage.setItem(getProfileStateKey(profileId), JSON.stringify(state));
}

export function deleteStoredProfile(profileId: string) {
  window.localStorage.removeItem(getProfileStateKey(profileId));
}

export function buildProfileBackup(profile: ProfileSummary, state: AppState): ProfileBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
    },
    state,
  };
}

export function serializeProfileBackup(profile: ProfileSummary, state: AppState) {
  return JSON.stringify(buildProfileBackup(profile, state), null, 2);
}

export function parseProfileBackup(raw: string) {
  const parsed = JSON.parse(raw) as Partial<ProfileBackup>;

  if (parsed.version !== 1 || !parsed.profile || typeof parsed.profile.name !== 'string' || !parsed.state) {
    throw new Error('Invalid backup file.');
  }

  return {
    profileName: parsed.profile.name.trim() || 'Imported Profile',
    state: parseStoredAppState(JSON.stringify(parsed.state), 'profile-backup-v1'),
  };
}
