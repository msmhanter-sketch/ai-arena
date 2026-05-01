const RANK_LABELS = ['1st','2nd','3rd','4th','5th','6th'];

export default function Leaderboard({ overallWins = {}, agents = [], roundHistory = [], totalPrizePool = 0 }) {
  const sorted = Object.entries(overallWins).sort((a,b) => b[1]-a[1]).slice(0,6);
  const total  = Object.values(overallWins).reduce((s,v)=>s+v,0);

  return (
    <div className="glass" style={{ padding: 20 }}>
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Total Rounds', val: total, color: 'var(--purple)' },
          { label: 'Prize Pool', val: `$${totalPrizePool.toFixed(0)}`, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono', fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="section-label">All-Time Wins</div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>First round in progress...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sorted.map(([id, wins], i) => {
            const agent = agents.find(a => a.id === id);
            if (!agent) return null;
            const pct = total > 0 ? (wins / total) * 100 : 0;
            return (
              <div key={id} style={{
                padding: '10px 14px', borderRadius: 12,
                background: i === 0 ? `${agent.color}0d` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i === 0 ? agent.color + '30' : 'rgba(255,255,255,0.05)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono', background: i === 0 ? 'rgba(240,180,41,0.14)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#f0b429' : 'var(--muted)', border: `1px solid ${i === 0 ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}` }}>{RANK_LABELS[i] ?? `#${i+1}`}</div>
                  <span style={{ fontSize: 18 }}>{agent.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{agent.name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 15, color: agent.color }}>{wins}W</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                </div>
                {/* Win rate bar */}
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: agent.color, borderRadius: 99, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {roundHistory.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 20 }}>Recent Rounds</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {roundHistory.slice(0,4).map(r => (
              <div key={r.round} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>#{r.round}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{r.winnerEmoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.winnerColor }}>{r.winnerName}</span>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                  ${r.finalStates?.[r.winner]?.portfolio?.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
