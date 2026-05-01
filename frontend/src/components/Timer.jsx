export default function Timer({ timeLeft = 0, bettingLocked, round }) {
  const totalMs    = 120_000;
  const pct        = Math.max(0, Math.min(100, (timeLeft / totalMs) * 100));
  const secs       = Math.floor(timeLeft / 1000);
  const minutes    = Math.floor(secs / 60);
  const seconds    = secs % 60;
  const isCritical = secs <= 15;
  const isBetting  = !bettingLocked && secs > 90;

  const color = isCritical ? 'var(--red)' : bettingLocked ? 'var(--cyan)' : 'var(--green)';
  const R     = 24;
  const circ  = 2 * Math.PI * R;
  const offset = circ * (1 - pct / 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* SVG ring */}
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
        <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
          <circle
            cx="32" cy="32" r={R}
            fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s',
              filter: `drop-shadow(0 0 ${isCritical ? 10 : 6}px ${color}90)`,
            }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 900, color,
            animation: isCritical ? 'pulse-glow 0.5s infinite' : 'none',
            lineHeight: 1,
          }}>
            {minutes}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Phase info */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
          Round #{round}
        </div>
        {isBetting ? (
          <span className="badge badge-open"><div className="dot dot-green" />Bets Open</span>
        ) : bettingLocked && secs > 15 ? (
          <span className="badge badge-cyan"><div className="dot dot-cyan" />In Battle</span>
        ) : isCritical ? (
          <span className="badge badge-live" style={{ animation: 'pulse-glow 0.6s infinite' }}>
            <div className="dot dot-red" />Final Seconds!
          </span>
        ) : (
          <span className="badge badge-purple"><div className="dot dot-purple" />Battle</span>
        )}

        {/* Linear progress bar under badge */}
        <div style={{ marginTop: 6, height: 2, width: 88, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${pct}%`,
            background: color,
            transition: 'width 0.9s linear, background 0.4s',
            boxShadow: `0 0 6px ${color}60`,
          }} />
        </div>
      </div>
    </div>
  );
}
