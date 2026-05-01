import { useEffect, useRef, useState } from 'react';

const RANK_LABELS = ['1st','2nd','3rd','4th','5th','6th'];

export default function RoundResultOverlay({ result, agents, myBet, onClose }) {
  const [countdown, setCountdown] = useState(7);
  const timerRef = useRef(null);

  useEffect(() => {
    setCountdown(7);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); onClose(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [result]);

  if (!result) return null;

  const winner    = agents.find(a => a.id === result.winner);
  const sorted    = Object.entries(result.finalStates ?? {})
    .sort((a, b) => b[1].portfolio - a[1].portfolio);

  // Find MY result properly — match by betResults keys
  const myBetResult = myBet
    ? Object.entries(result.betResults ?? {}).find(([, v]) => v)?.[1]
    : null;

  const RANK_COLORS = ['#f0b429', '#94a3b8', '#cd7f32'];

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="overlay-card"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560, padding: '40px 36px', textAlign: 'left' }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 320, height: 320, borderRadius: '50%',
          background: `${winner?.color}20`, filter: 'blur(90px)', pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
          {/* Winner avatar */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%', margin: '0 auto 18px',
            background: `linear-gradient(135deg, ${winner?.color}30, ${winner?.color}10)`,
            border: `2px solid ${winner?.color}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, animation: 'float 2.5s ease infinite',
            boxShadow: `0 0 60px ${winner?.color}45, 0 0 120px ${winner?.color}18`,
          }}>
            {winner?.emoji}
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
            Round #{result.round} — Winner
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: winner?.color, letterSpacing: '-0.03em', marginBottom: 6 }}>
            {winner?.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Final Portfolio</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 900, color: 'var(--green)' }}>
                ${result.finalStates?.[result.winner]?.portfolio?.toFixed(2)}
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Gain</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 900, color: 'var(--green)' }}>
                +${result.finalStates?.[result.winner]?.pnl?.toFixed(2)}
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Trades</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 900, color: winner?.color }}>
                {result.finalStates?.[result.winner]?.trades}
              </div>
            </div>
          </div>
        </div>

        {/* Your bet result */}
        {myBetResult && (
          <div style={{
            padding: '14px 18px', borderRadius: 14, marginBottom: 16, textAlign: 'center',
            background: myBetResult.won ? 'rgba(45,206,142,0.07)' : 'rgba(240,96,112,0.07)',
            border: `1px solid ${myBetResult.won ? 'rgba(45,206,142,0.25)' : 'rgba(240,96,112,0.25)'}`,
            animation: 'scale-up 0.4s 0.2s both',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: myBetResult.won ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
              {myBetResult.won ? 'You Won!' : 'You Lost'}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 900, color: myBetResult.won ? 'var(--green)' : 'var(--red)' }}>
              {myBetResult.won ? `+$${myBetResult.payout?.toFixed(2)}` : `-$${myBetResult.bet}`}
            </div>
            {myBetResult.won && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Profit: +${myBetResult.profit?.toFixed(2)} USDC
              </div>
            )}
          </div>
        )}

        {/* Final standings */}
        <div style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Final Standings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {sorted.map(([id, stats], i) => {
              const agent = agents.find(a => a.id === id);
              const isWin = i === 0;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Rank badge */}
                  <div style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                    fontFamily: 'JetBrains Mono', letterSpacing: '0.04em', minWidth: 30, textAlign: 'center',
                    background: i < 3 ? `${RANK_COLORS[i]}18` : 'rgba(255,255,255,0.04)',
                    color: i < 3 ? RANK_COLORS[i] : 'var(--muted)',
                    border: `1px solid ${i < 3 ? RANK_COLORS[i] + '30' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    {RANK_LABELS[i] ?? `#${i+1}`}
                  </div>
                  <span style={{ fontSize: 18 }}>{agent?.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: isWin ? agent?.color : 'var(--text2)' }}>{agent?.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, color: stats.pnl >= 0 ? 'var(--green)' : 'var(--red)', minWidth: 64, textAlign: 'right' }}>
                    {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--muted)', minWidth: 56, textAlign: 'right' }}>
                    ${stats.portfolio.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pool stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Round Pool',       val: `$${result.totalPool ?? 0}`,       color: 'var(--text)' },
            { label: 'Total Distributed', val: `$${result.totalPrizePool ?? 0}`, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 16, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Countdown + close */}
        <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }} onClick={onClose}>
          Next Round in {countdown}s →
        </button>

        {/* Bottom accent */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 22px 22px', background: `linear-gradient(90deg, ${winner?.color}, transparent)` }} />
      </div>
    </div>
  );
}
