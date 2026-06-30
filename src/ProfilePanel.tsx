import type { ChangeEvent, RefObject } from 'react';
import { DEFAULT_PROFILE_NAME } from './gameData';
import type { ProfileSummary } from './types';

type ProfilePanelProps = {
  activeProfileId: string;
  activeProfileName?: string;
  currentStreak: number;
  bestStreak: number;
  totalWins: number;
  nextRewardGoal: number;
  rankTitle: string;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  nextRewardLabel: string;
  profiles: ProfileSummary[];
  profileStatus: string | null;
  importInputRef: RefObject<HTMLInputElement | null>;
  onSwitchProfile: (profileId: string) => void;
  onAddProfile: () => void;
  onRenameProfile: () => void;
  onExportProfile: () => void;
  onImportProfile: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteProfile: () => void;
};

export function ProfilePanel({
  activeProfileId,
  activeProfileName,
  currentStreak,
  bestStreak,
  totalWins,
  nextRewardGoal,
  rankTitle,
  level,
  currentLevelXp,
  nextLevelXp,
  progressPercent,
  nextRewardLabel,
  profiles,
  profileStatus,
  importInputRef,
  onSwitchProfile,
  onAddProfile,
  onRenameProfile,
  onExportProfile,
  onImportProfile,
  onDeleteProfile,
}: ProfilePanelProps) {
  return (
    <>
      <div className="hero-stats">
        <article className="stat-card">
          <strong className="stat-value">{currentStreak}</strong>
          <span className="stat-label">Active combo</span>
        </article>
        <article className="stat-card">
          <strong className="stat-value">{bestStreak}</strong>
          <span className="stat-label">Best combo</span>
        </article>
        <article className="stat-card">
          <strong className="stat-value">{totalWins}</strong>
          <span className="stat-label">Raids cleared</span>
        </article>
        <article className="stat-card">
          <strong className="stat-value">{nextRewardGoal}</strong>
          <span className="stat-label">Next system reward</span>
        </article>
      </div>

      <div className="rank-panel">
        <div className="rank-copy">
          <strong>{rankTitle}</strong>
          <span>Hunter Level {level}</span>
        </div>
        <div className="rank-bar" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="rank-note">
          {currentLevelXp} / {nextLevelXp} XP to next rank. System reward: {nextRewardLabel}
        </p>
      </div>

      <div className="profile-panel">
        <div className="profile-panel-copy">
          <small>Active hunter</small>
          <strong>{activeProfileName ?? DEFAULT_PROFILE_NAME}</strong>
        </div>
        <div className="profile-controls">
          <select
            aria-label="Select profile"
            className="profile-select"
            onChange={(event) => onSwitchProfile(event.target.value)}
            value={activeProfileId}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <button className="ghost-button" onClick={onAddProfile} type="button">
            New
          </button>
          <button className="ghost-button" onClick={onRenameProfile} type="button">
            Rename
          </button>
          <button className="ghost-button" onClick={onExportProfile} type="button">
            Export
          </button>
          <button className="ghost-button" onClick={() => importInputRef.current?.click()} type="button">
            Import
          </button>
          <button
            className="ghost-button danger-button"
            disabled={profiles.length <= 1}
            onClick={onDeleteProfile}
            type="button"
          >
            Delete
          </button>
        </div>
        <input
          accept="application/json"
          className="hidden-input"
          onChange={onImportProfile}
          ref={importInputRef}
          type="file"
        />
        <p className="profile-note">
          Each hunter profile keeps separate missions and raid history in this browser. Export creates a JSON backup; import adds a new hunter from backup.
        </p>
        {profileStatus ? <p className="profile-status">{profileStatus}</p> : null}
      </div>
    </>
  );
}
