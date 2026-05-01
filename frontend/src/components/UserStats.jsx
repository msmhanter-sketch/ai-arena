import { useState } from 'react';

export default function UserStats({ userId, roundHistory, myBet, walletAddress }) {
  const [expanded, setExpanded] = useState(false);

  // Compute stats from round history
  const stats = { wins: 0, losses: 0, totalBet: 0, totalPayout: 0 };
  roundHistory.forEach(r => {
    const res = r.betResults?.[userId];
    if (!res) return;
    stats.totalBet    += res.bet ?? 0;
    stats.totalPayout += res.payout ?? 0;
    if (res.won) stats.wins++;
    else stats.losses++;
  });

  const totalRounds  = stats.wins + stats.losses;
  const winRate      = totalRounds > 0 ? ((stats.wins / totalRounds) * 100).toFixed(0) : 0;
  const netPnl       = stats.totalPayout - stats.totalBet;
  const isProfit     = netPnl >= 0;

  // Current streak
  let streak = 0;
  for (let i = 0; i < roundHistory.length; i++) {
    const res = roundHistory[i]?.betResults?.[userId];
    if (!res) break;
    if (i === 0) { streak = res.won ? 1 : -1; }
    else if (streak > 0 && res.won) streak++;
    else if (streak < 0 && !res.won) streak--;
    else break;
  }

  if (totalRounds === 0 && !myBet) return null;

  return (
    <div className="glass" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 14 : 0 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Your Stats</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streak !== 0 && (
            <div style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase', background: streak > 0 ? 'rgba(45,206,142,0.12)' : 'rgba(240,96,112,0.12)', color: streak > 0 ? 'var(--green)' : 'var(--red)', border: `1px solid ${streak > 0 ? 'rgba(45,206,142,0.25)' : 'rgba(240,96,112,0.25)'}` }}>
              {streak > 0 ? `${streak}W Streak` : `${Math.abs(streak)}L Streak`}
            </div>
          )}
          {totalRounds > 0 && (
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--muted)', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="m6 9 6 6 6-6"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Quick summary row (always visible) */}
      {totalRounds > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Win Rate', val: `${winRate}%`, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' },
            { label: 'W / L', val: `${stats.wins}/${stats.losses}`, color: 'var(--text)' },
            { label: 'Net P&L', val: `${isProfit ? '+' : ''}$${netPnl.toFixed(0)}`, color: isProfit ? 'var(--green)' : 'var(--red)' },
            { label: 'Rounds', val: totalRounds, color: 'var(--muted)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: round history */}
      {expanded && totalRounds > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Round History</div>
          {roundHistory.slice(0, 5).map((r, i) => {
            const res = r.betResults?.[userId];
            if (!res) return null;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: res.won ? 'rgba(45,206,142,0.06)' : 'rgba(240,96,112,0.06)', border: `1px solid ${res.won ? 'rgba(45,206,142,0.12)' : 'rgba(240,96,112,0.12)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em', background: res.won ? 'rgba(45,206,142,0.15)' : 'rgba(240,96,112,0.15)', color: res.won ? 'var(--green)' : 'var(--red)' }}>{res.won ? 'WIN' : 'LOSS'}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>Round #{r.round}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{r.winnerName}</span>
                </div>
                <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, color: res.won ? 'var(--green)' : 'var(--red)' }}>
                  {res.won ? `+$${res.profit?.toFixed(2)}` : `-$${res.bet}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Wallet address hint */}
      {walletAddress && (
        <div style={{ marginTop: 10, fontSize: 9, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textAlign: 'center' }}>
          {walletAddress.slice(0, 6)}…{walletAddress.slice(-6)}
        </div>
      )}
    </div>
  );
}
