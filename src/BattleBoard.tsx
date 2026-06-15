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
                    {card.symbol || '🗡️'}
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
                      {card.symbol || '🗡️'}
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
