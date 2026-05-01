import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

// Agent tag colors
const TAG_COLORS = {
  'HIGH RISK':   '#f06070',
  'SMART':       '#1dc8e4',
  'WILDCARD':    '#f0b429',
  'STABLE':      '#2dce8e',
  'SAFE':        '#e458a0',
  'CONTRARIAN':  '#fb923c',
};

// Mood → colored circle only (no emoji)
const MOOD_COLOR = { confident: '#2dce8e', nervous: '#f06070', neutral: '#4a5568' };

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0c0c22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontFamily: 'JetBrains Mono', color: '#dde4f0' }}>
      ${payload[0].value?.toFixed(2)}
    </div>
  );
};

const RANK_LABELS = ['1st','2nd','3rd','4th','5th','6th'];

export default function AgentCard({ agent, rank, isMyBet, selected, onClick }) {
  const isPos     = agent.pnlPct >= 0;
  const isLeading = rank === 0;
  const moodColor = MOOD_COLOR[agent.mood] ?? MOOD_COLOR.neutral;
  const tagColor  = TAG_COLORS[agent.tag] ?? agent.color;

  const chartData = useMemo(
    () => agent.history.map((v, i) => ({ i, v })),
    [agent.history]
  );

  const borderColor = isLeading
    ? 'rgba(240,180,41,0.4)'
    : selected
      ? `${agent.color}55`
      : isMyBet
        ? `${agent.color}35`
        : 'rgba(255,255,255,0.05)';

  const bgColor = isLeading
    ? 'linear-gradient(145deg, rgba(240,180,41,0.07), rgba(255,255,255,0.02))'
    : selected
      ? `linear-gradient(145deg, ${agent.color}12, rgba(255,255,255,0.02))`
      : 'rgba(255,255,255,0.025)';

  return (
    <div
      onClick={onClick}
      className="agent-card"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        animation: isLeading ? 'leading-ring 2.5s ease infinite' : 'none',
        boxShadow: selected ? `0 0 28px ${agent.color}22` : 'none',
      }}
    >
      {/* Ambient glow top-right */}
      <div style={{
        position: 'absolute', top: -50, right: -50,
        width: 130, height: 130, borderRadius: '50%',
        background: `${agent.color}14`, filter: 'blur(45px)', pointerEvents: 'none',
      }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar — colored circle with agent initial */}
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`,
            border: `1px solid ${agent.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isLeading ? 18 : 16,
            boxShadow: `0 0 16px ${agent.color}28`,
            color: agent.color,
            fontWeight: 900,
            fontFamily: 'JetBrains Mono',
          }}>
            {agent.emoji ?? agent.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {agent.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                background: `${tagColor}14`, color: tagColor,
                border: `1px solid ${tagColor}28`,
              }}>
                {agent.tag}
              </span>
              {/* Mood indicator — small colored dot only */}
              <div title={`Mood: ${agent.mood}`} style={{ width: 6, height: 6, borderRadius: '50%', background: moodColor }} />
            </div>
          </div>
        </div>

        {/* Rank + MY BET */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
            background: isLeading ? 'rgba(240,180,41,0.14)' : 'rgba(255,255,255,0.05)',
            color: isLeading ? '#f0b429' : 'var(--muted)',
            border: `1px solid ${isLeading ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}`,
            letterSpacing: '0.06em',
            fontFamily: 'JetBrains Mono',
          }}>
            {RANK_LABELS[rank] ?? `#${rank+1}`}
          </div>
          {isMyBet && (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 7px', borderRadius: 4,
              background: `${agent.color}20`, color: agent.color,
              border: `1px solid ${agent.color}40`, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              YOUR BET
            </span>
          )}
        </div>
      </div>

      {/* ── Mini chart ─────────────────────────────────────── */}
      <div style={{ height: 58, marginBottom: 12, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`g-${agent.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={agent.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={agent.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['auto','auto']} hide />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v"
              stroke={agent.color} strokeWidth={2}
              fill={`url(#g-${agent.id})`}
              dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono', letterSpacing: '-0.04em' }}>
            ${agent.portfolio.toFixed(0)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono', color: isPos ? 'var(--green)' : 'var(--red)', marginTop: 1 }}>
            {isPos ? '+' : ''}${agent.pnl.toFixed(2)}
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>({isPos ? '+' : ''}{agent.pnlPct.toFixed(1)}%)</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Action</div>
          <div style={{
            fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono',
            padding: '2px 7px', borderRadius: 5,
            background: agent.lastAction.startsWith('BUY') ? 'rgba(45,206,142,0.1)' :
                        agent.lastAction.startsWith('SELL') ? 'rgba(240,96,112,0.1)' : 'rgba(255,255,255,0.04)',
            color: agent.lastAction.startsWith('BUY') ? 'var(--green)' :
                   agent.lastAction.startsWith('SELL') ? 'var(--red)' : 'var(--muted)',
          }}>
            {agent.lastAction}
          </div>
          <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>{agent.trades} trades</div>
        </div>
      </div>

      {/* ── Confidence bar ─────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 8.5, letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 800 }}>Confidence</span>
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: moodColor, fontWeight: 700 }}>{Math.round(agent.confidence)}%</span>
        </div>
        <div className="conf-track">
          <div className="conf-fill" style={{ width: `${agent.confidence}%`, background: `linear-gradient(90deg, ${agent.color}70, ${agent.color})` }} />
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${agent.color}80, transparent)`,
      }} />
    </div>
  );
}
