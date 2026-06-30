import type { CSSProperties } from 'react';
import { isImageLike } from './questDomain';
import type { BattleState } from './types';

export function BattleBoard({
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
  const healthPercent = Math.max(0, Math.round((battleState.currentHp / battleState.totalHp) * 100));

  return (
    <main className="shell board-shell">
      <section className="hero-card board-hero">
        <button className="ghost-button back-button" onClick={onBack} type="button">
          Back to System
        </button>
        <p className="eyebrow">GATE RAID</p>
        <h1>{battleState.title}</h1>
        <p className="hero-copy">{battleState.subtitle}</p>
      </section>

      <section className={`battle-scene ${hitCount > 0 ? 'is-hit' : ''}`} aria-label="Battle scene">
        <div className="battle-atmosphere" aria-hidden="true" />

        <section className="monster-stage">
          <div className="monster-stage-topbar">
            <div>
              <span className="monster-label">Dungeon Boss</span>
              <strong>{battleState.monsterName}</strong>
            </div>
            <span className={`monster-status ${monsterDefeated ? 'is-victory' : ''}`}>
              {monsterDefeated ? 'KO' : `${battleState.currentHp} HP`}
            </span>
          </div>

          <div className="monster-intent-row">
            <span className="intent-badge">
              {monsterDefeated ? 'Core shattered' : `Boss phase: survive ${handCards.length} more actions`}
            </span>
            <span className="battle-stat-chip">{battleState.totalHp} max HP</span>
          </div>

          {monsterDefeated ? <p className="victory-reward">Raid reward unlocked: {battleState.subtitle}</p> : null}

          <article className="monster-boss-card" key={hitCount}>
            <div className="monster-boss-topline">
              <span className="battle-card-type">Boss</span>
            </div>
            <div className="monster-boss-art" aria-hidden="true">
              {monsterDefeated ? (
                '💥'
              ) : isImageLike(battleState.monsterArt) ? (
                <img alt="" className="monster-boss-image" src={battleState.monsterArt} />
              ) : (
                battleState.monsterArt
              )}
            </div>
            <strong>{battleState.monsterName}</strong>
            <small>{battleState.monsterMood}</small>
          </article>

          <div className="monster-bar-wrap">
            <div className="monster-bar" aria-hidden="true">
              <span style={{ width: `${healthPercent}%` }} />
            </div>
            <div className="battle-stats">
              <span>{fieldCards.length} skills committed</span>
            </div>
          </div>
        </section>

        <section className="battlefield-lane">
          <div className="section-heading battle-heading">
            <h2>Committed Skills</h2>
            <span>{fieldCards.length} skills pressuring the boss</span>
          </div>
          <div className="field-row">
            {fieldCards.length === 0 ? (
              <article className="battle-empty field-empty">
                <strong>No cards in play yet</strong>
                <span>Commit an action from your loadout and it will enter the assault line.</span>
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
                    <span className="battle-card-type">active skill</span>
                  </div>
                  <div className="battle-card-art" aria-hidden="true">
                    {card.symbol || '🗡️'}
                  </div>
                  <strong>{card.title}</strong>
                  <span className="battle-card-action">Withdraw skill</span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="hand-dock">
          <div className="hand-hud">
            <div className="section-heading battle-heading">
              <h2>Hunter Loadout</h2>
              <span>{handCards.length} actions ready</span>
            </div>
            <button className="ghost-button reset-button" onClick={onResetBattle} type="button">
              Reset Raid
            </button>
          </div>
          <div className="hand-fan">
            {handCards.length === 0 ? (
              <article className="battle-empty hand-empty">
                <strong>No actions remaining</strong>
                <span>Everything ready for use is already committed.</span>
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
                      {card.symbol || '🗡️'}
                    </div>
                    <div className="hand-card-copy">
                      <div className="battle-card-topline">
                        <span className="battle-card-type">{card.family} skill</span>
                      </div>
                      <strong>{card.title}</strong>
                    </div>
                  </div>
                  <span className="battle-card-action">Commit skill</span>
                </button>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
