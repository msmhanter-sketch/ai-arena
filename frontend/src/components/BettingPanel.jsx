import { useState } from 'react';

const PRESETS = [10, 25, 50, 100, 200];

// Status labels for on-chain flow
const STATUS_LABELS = {
  signing:   { text: 'Approve in wallet…', color: '#f0b429' },
  sending:   { text: 'Sending transaction…', color: '#1dc8e4' },
  verifying: { text: 'Verifying on-chain…', color: '#7c5af0' },
  confirmed: { text: 'Confirmed!', color: '#2dce8e' },
};

export default function BettingPanel({ agents = [], bettingLocked, myBet, onBet, odds = {}, walletConnected, betStatus, escrowAddress }) {
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState(50);

  const selected = agents.find(a => a.id === selectedId);
  const oddsData = odds?.perAgent ?? {};
  const totalPool = odds?.total ?? 0;
  const status = betStatus ? STATUS_LABELS[betStatus] : null;

  // ── Locked state ──────────────────────────────────────────────────────
  if (bettingLocked) {
    return (
      <div className="glass" style={{ padding: '20px' }}>
        <div className="section-label">Betting Panel</div>
        <div style={{
          textAlign: 'center', padding: '28px 16px',
          background: 'rgba(240,180,41,0.04)',
          border: '1px solid rgba(240,180,41,0.18)', borderRadius: 14,
        }}>
          {/* Lock icon SVG */}
          <div style={{ margin: '0 auto 12px', width: 36, height: 36, borderRadius: 10, background: 'rgba(240,180,41,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0b429" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#f0b429', marginBottom: 4 }}>Battle In Progress</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: myBet ? 16 : 0 }}>
            Watch the AIs fight it out…
          </div>
          {myBet && (() => {
            const betAgent = agents.find(a => a.id === myBet.agentId);
            const myOdds   = oddsData[myBet.agentId]?.odds;
            const potential = myOdds ? (myBet.amount * myOdds).toFixed(2) : '?';
            return (
              <div style={{ padding: '14px', borderRadius: 12, textAlign: 'left', background: `${betAgent?.color}0d`, border: `1px solid ${betAgent?.color}35` }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Your Position</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{betAgent?.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{betAgent?.name}</span>
                  {myBet.onChain && (
                    <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, background: 'rgba(45,206,142,0.12)', color: '#2dce8e', border: '1px solid rgba(45,206,142,0.25)', fontWeight: 800, letterSpacing: '0.06em' }}>ON-CHAIN</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>Staked</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800 }}>${myBet.amount}</div>
                  </div>
                  <div style={{ background: 'rgba(45,206,142,0.06)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(45,206,142,0.15)' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>Potential Win</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--green)' }}>${potential}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── Already bet ──────────────────────────────────────────────────────
  if (myBet) {
    const betAgent = agents.find(a => a.id === myBet.agentId);
    const myOdds   = oddsData[myBet.agentId]?.odds;
    return (
      <div className="glass" style={{ padding: 20 }}>
        <div className="section-label">Your Position</div>
        <div style={{ textAlign: 'center', padding: '24px 16px', background: `${betAgent?.color}0d`, border: `1px solid ${betAgent?.color}40`, borderRadius: 14 }}>
          <div style={{ fontSize: 38, marginBottom: 8, animation: 'float 2s ease infinite' }}>{betAgent?.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{betAgent?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>You're backing this bot</span>
            {myBet.onChain && (
              <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, background: 'rgba(45,206,142,0.12)', color: '#2dce8e', border: '1px solid rgba(45,206,142,0.25)', fontWeight: 800, letterSpacing: '0.06em' }}>ON-CHAIN</span>
            )}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 34, fontWeight: 900, color: 'var(--green)' }}>
            ${myBet.amount}
            <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 6 }}>USDC</span>
          </div>
          {myOdds && <div style={{ fontSize: 14, color: betAgent?.color, marginTop: 8, fontWeight: 600 }}>Odds: {myOdds}x → Potential ${(myBet.amount * myOdds).toFixed(2)}</div>}
          {myBet.txSignature && (
            <a href={`https://explorer.solana.com/tx/${myBet.txSignature}?cluster=devnet`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 11, color: 'var(--purple)', textDecoration: 'none', fontFamily: 'JetBrains Mono' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              View on Explorer
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Place bet ─────────────────────────────────────────────────────────
  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Place Your Bet</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="dot dot-green" />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>BETS OPEN</span>
        </div>
      </div>

      {/* Mode indicator */}
      <div style={{
        padding: '8px 12px', borderRadius: 8, marginBottom: 12,
        background: walletConnected ? 'rgba(45,206,142,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${walletConnected ? 'rgba(45,206,142,0.2)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: walletConnected ? '#2dce8e' : 'var(--muted)' }} />
          <span style={{ fontSize: 11, color: walletConnected ? '#2dce8e' : 'var(--muted)', fontWeight: 700 }}>
            {walletConnected ? 'ON-CHAIN MODE' : 'DEMO MODE'}
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          {walletConnected ? 'Solana Devnet' : 'Connect wallet for on-chain'}
        </span>
      </div>

      {totalPool > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(124,90,240,0.06)', border: '1px solid rgba(124,90,240,0.18)', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Total Pool</span>
          <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--purple)' }}>${totalPool} USDC</span>
        </div>
      )}

      {/* Agent list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {agents.map(a => {
          const agOdds = oddsData[a.id];
          const isSelected = selectedId === a.id;
          return (
            <div key={a.id} onClick={() => setSelectedId(prev => prev === a.id ? null : a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${isSelected ? a.color + '55' : 'rgba(255,255,255,0.05)'}`,
                background: isSelected ? `${a.color}0e` : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{a.emoji}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{a.name}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: a.pnlPct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                  {a.pnlPct >= 0 ? '+' : ''}{a.pnlPct?.toFixed(1)}%
                </div>
                {agOdds?.odds && <div style={{ fontSize: 10, color: a.color, fontWeight: 700 }}>{agOdds.odds}x</div>}
              </div>
              {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, boxShadow: `0 0 6px ${a.color}` }} />}
            </div>
          );
        })}
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount (USDC)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 10 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setAmount(p)} style={{
              padding: '7px 4px', borderRadius: 8,
              border: `1px solid ${amount === p ? 'var(--purple)' : 'rgba(255,255,255,0.07)'}`,
              background: amount === p ? 'rgba(124,90,240,0.14)' : 'transparent',
              color: amount === p ? 'var(--purple)' : 'var(--muted)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'Outfit, sans-serif',
            }}>
              ${p}
            </button>
          ))}
        </div>
        <input type="number" value={amount} min={1} max={10000} onChange={e => setAmount(Number(e.target.value))} />
        <input type="range" min={1} max={500} value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ marginTop: 8 }} />
      </div>

      {/* Potential payout */}
      {selectedId && oddsData[selectedId]?.odds && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: 'rgba(45,206,142,0.06)', border: '1px solid rgba(45,206,142,0.18)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Potential payout</span>
          <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--green)' }}>${(amount * oddsData[selectedId].odds).toFixed(2)}</span>
        </div>
      )}

      {/* Tx status indicator */}
      {status && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: `${status.color}0a`, border: `1px solid ${status.color}25`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 14, height: 14, border: `2px solid ${status.color}40`, borderTopColor: status.color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: 13, color: status.color, fontWeight: 600 }}>{status.text}</span>
        </div>
      )}

      {/* Bet button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: 15 }}
        disabled={!selectedId || amount <= 0 || !!betStatus}
        onClick={() => onBet(selectedId, amount)}
      >
        {betStatus
          ? status?.text ?? 'Processing…'
          : selectedId
            ? `${walletConnected ? 'Sign & ' : ''}Bet $${amount} on ${selected?.name}`
            : 'Select a bot to bet on'}
      </button>

      {/* SOL cost hint */}
      {walletConnected && selectedId && (
        <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 8, fontFamily: 'JetBrains Mono' }}>
          Cost: {(amount * 0.001).toFixed(4)} SOL (devnet) → Escrow
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
        Bets close 30s after round start · {walletConnected ? 'Settlement on Solana Devnet' : 'Connect wallet for on-chain bets'}
      </div>
    </div>
  );
}
