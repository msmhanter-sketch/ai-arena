import { useState, useRef } from 'react';

export default function AgentModal({ agent, onClose }) {
  const [tab, setTab] = useState('overview');
  if (!agent) return null;

  const isPos = agent.pnlPct >= 0;
  const tradeLog = agent.tradeLog ?? [];
  const buys  = tradeLog.filter(t => t.type === 'BUY').length;
  const sells = tradeLog.filter(t => t.type === 'SELL').length;
  const winRate = agent.trades > 0 ? Math.round((agent.pnl > 0 ? 1 : 0) * 100) : 0;

  const STRATEGY_DESC = {
    momentum:   'Follows price momentum — buys on upswings, sells on downtrends. Reacts aggressively to news events.',
    neural:     'Uses dual moving-average crossover (MA5 vs MA20) to detect trend reversals. Slow but precise.',
    chaos:      'Pure entropy engine — random buy/sell decisions with variable position sizing. High variance.',
    arbitrage:  'Exploits micro price inefficiencies by buying below 10-bar MA and selling above it.',
    dca:        'Dollar-cost averaging every 8 ticks. Liquidates positions under time pressure.',
    contrarian: 'Buys panic and sells euphoria. Thrives during extreme market events.',
  };

  const RISK_COLOR = {
    'HIGH RISK': '#f06070', 'SMART': '#1dc8e4', 'WILDCARD': '#f0b429',
    'STABLE': '#2dce8e', 'SAFE': '#e458a0', 'CONTRARIAN': '#fb923c',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fade-in 0.2s ease' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'linear-gradient(145deg, #0c0c22, #111128)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: '32px', maxWidth: 520, width: '92%', maxHeight: '90vh', overflowY: 'auto', animation: 'scale-up 0.3s cubic-bezier(0.34,1.56,0.64,1)', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text2)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)`, border: `1px solid ${agent.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: `0 0 24px ${agent.color}30` }}>
            {agent.emoji}
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>{agent.name}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: `${RISK_COLOR[agent.tag] ?? agent.color}15`, color: RISK_COLOR[agent.tag] ?? agent.color, border: `1px solid ${RISK_COLOR[agent.tag] ?? agent.color}30`, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {agent.tag}
              </span>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 700, color: isPos ? 'var(--green)' : 'var(--red)' }}>
                {isPos ? '+' : ''}{agent.pnlPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
          {['overview', 'trades', 'strategy'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'all 0.15s', background: tab === t ? agent.color : 'transparent', color: tab === t ? '#fff' : 'var(--muted)' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Portfolio', val: `$${agent.portfolio.toFixed(2)}`, color: 'var(--text)' },
                { label: 'P&L', val: `${isPos?'+':''}$${agent.pnl.toFixed(2)}`, color: isPos ? 'var(--green)' : 'var(--red)' },
                { label: 'Total Trades', val: agent.trades, color: 'var(--text)' },
                { label: 'Confidence', val: `${Math.round(agent.confidence)}%`, color: agent.color },
                { label: 'Buys', val: buys, color: 'var(--green)' },
                { label: 'Sells', val: sells, color: 'var(--red)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Mood</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: agent.mood === 'confident' ? 'var(--green)' : agent.mood === 'nervous' ? 'var(--red)' : 'var(--muted)' }} />
                <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{agent.mood}</span>
              </div>
            </div>
          </div>
        )}

        {/* Trades tab */}
        {tab === 'trades' && (
          <div>
            {tradeLog.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>No trades yet this round</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 320, overflowY: 'auto' }}>
                {[...tradeLog].reverse().map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: t.type === 'BUY' ? 'rgba(45,206,142,0.06)' : 'rgba(240,96,112,0.06)', border: `1px solid ${t.type === 'BUY' ? 'rgba(45,206,142,0.15)' : 'rgba(240,96,112,0.15)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: t.type === 'BUY' ? 'rgba(45,206,142,0.15)' : 'rgba(240,96,112,0.15)', color: t.type === 'BUY' ? 'var(--green)' : 'var(--red)', letterSpacing: '0.06em' }}>{t.type}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text2)' }}>${t.price}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>${t.amount?.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>{new Date(t.ts).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Strategy tab */}
        {tab === 'strategy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '16px', borderRadius: 12, background: `${agent.color}0a`, border: `1px solid ${agent.color}25` }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Strategy: {agent.strategy}</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{STRATEGY_DESC[agent.strategy] ?? agent.desc}</p>
            </div>
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Signal Sources</div>
              {['momentum','neural','arbitrage'].includes(agent.strategy) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    agent.strategy === 'momentum'  && 'Price momentum (5-tick delta)',
                    agent.strategy === 'neural'    && 'MA5 / MA20 crossover signal',
                    agent.strategy === 'arbitrage' && '10-bar mean reversion band',
                    'Live news event reactions',
                    'Time-pressure urgency (last 30s)',
                  ].filter(Boolean).map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: agent.color }} />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom accent */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 22px 22px', background: `linear-gradient(90deg, ${agent.color}, transparent)` }} />
      </div>
    </div>
  );
}
