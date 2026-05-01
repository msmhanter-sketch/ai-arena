export default function BattleBar({ agents = [] }) {
  if (!agents.length) return null;
  const sorted = [...agents].sort((a, b) => b.portfolio - a.portfolio);
  const max = sorted[0]?.portfolio || 1100;
  const min = Math.min(...sorted.map(a => a.portfolio)) * 0.97;

  return (
    <div className="glass" style={{ padding: '18px 22px' }}>
      <div className="section-label">Live Rankings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {sorted.map((agent, i) => {
          const pct = Math.max(7, ((agent.portfolio - min) / (max - min + 1)) * 100);
          const isLeading = i === 0;
          const isPos = agent.pnlPct >= 0;
          const rankLabel = ['1st','2nd','3rd','4th','5th','6th'][i] ?? `#${i+1}`;

          return (
            <div key={agent.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Rank badge */}
                  <div style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 4,
                    fontFamily: 'JetBrains Mono', letterSpacing: '0.04em',
                    background: isLeading ? 'rgba(240,180,41,0.14)' : 'rgba(255,255,255,0.05)',
                    color: isLeading ? '#f0b429' : 'var(--muted)',
                    border: `1px solid ${isLeading ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    minWidth: 30, textAlign: 'center',
                  }}>
                    {rankLabel}
                  </div>
                  <span style={{ fontSize: 14 }}>{agent.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isLeading ? '#f0b429' : 'var(--text)' }}>
                    {agent.name}
                  </span>
                  {isLeading && (
                    <div style={{
                      fontSize: 8, fontWeight: 800, padding: '1px 7px', borderRadius: 4,
                      background: 'rgba(240,180,41,0.1)', color: '#f0b429',
                      border: '1px solid rgba(240,180,41,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase',
                      animation: 'pulse-glow 1.8s infinite',
                    }}>
                      LEADING
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)' }}>
                    {isPos ? '+' : ''}{agent.pnlPct.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--text)', minWidth: 52, textAlign: 'right' }}>
                    ${agent.portfolio.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div style={{ height: 26, background: 'rgba(255,255,255,0.03)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <div className="battle-bar" style={{
                  width: `${pct}%`,
                  background: isLeading
                    ? `linear-gradient(90deg, ${agent.color}70, ${agent.color}, rgba(240,180,41,0.8))`
                    : `linear-gradient(90deg, ${agent.color}55, ${agent.color})`,
                  boxShadow: isLeading ? `0 0 18px ${agent.color}45` : 'none',
                  display: 'flex', alignItems: 'center', paddingLeft: 10,
                }}>
                  {pct > 22 && (
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontFamily: 'JetBrains Mono', letterSpacing: '0.04em' }}>
                      {agent.lastAction.startsWith('BUY') ? 'BUYING' : agent.lastAction.startsWith('SELL') ? 'SELLING' : 'HOLDING'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
