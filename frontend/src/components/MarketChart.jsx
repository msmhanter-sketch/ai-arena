import { useMemo } from 'react';
import {
  ComposedChart, AreaChart, Area, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const PriceTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0c0c22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'JetBrains Mono', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <div style={{ color: '#64748b', fontSize: 9, marginBottom: 2 }}>PRICE</div>
      <div style={{ color: '#dde4f0', fontWeight: 700 }}>${payload[0]?.value?.toFixed(2)}</div>
    </div>
  );
};

export default function MarketChart({ marketHistory = [], marketVolume = [], marketPrice = 0 }) {
  const data = useMemo(
    () => marketHistory.map((v, i) => ({ i, price: v, vol: marketVolume[i] ?? 0 })),
    [marketHistory, marketVolume]
  );

  if (marketHistory.length === 0) return null;

  const startPrice = marketHistory[0] ?? 100;
  const isUp       = marketPrice >= startPrice;
  const changePct  = startPrice ? (((marketPrice - startPrice) / startPrice) * 100) : 0;
  const min        = Math.min(...marketHistory) * 0.996;
  const max        = Math.max(...marketHistory) * 1.004;
  const avgPrice   = marketHistory.reduce((a, b) => a + b, 0) / marketHistory.length;
  const color      = isUp ? '#2dce8e' : '#f06070';

  // Volatility = stddev
  const variance = marketHistory.reduce((s, v) => s + Math.pow(v - avgPrice, 2), 0) / marketHistory.length;
  const vol      = Math.sqrt(variance);
  const volLevel = vol < 1.5 ? 'LOW' : vol < 3.5 ? 'MED' : 'HIGH';
  const volColor = vol < 1.5 ? 'var(--green)' : vol < 3.5 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="glass" style={{ padding: '20px 24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 }}>
            SOL / USD — Simulated Market
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono', letterSpacing: '-0.04em', color: '#e2e8f0' }}>
              ${marketPrice.toFixed(2)}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono', color }}>
                {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                from open ${startPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className="badge badge-live"><div className="dot dot-red" />LIVE</div>
          {/* Volatility indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: `${volColor}10`, border: `1px solid ${volColor}25` }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={volColor} strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span style={{ fontSize: 9, fontWeight: 800, color: volColor, letterSpacing: '0.06em' }}>VOL {volLevel}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>
            H: ${Math.max(...marketHistory).toFixed(2)}<br/>
            L: ${Math.min(...marketHistory).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div style={{ height: 130, marginBottom: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis domain={[min, max]} hide />
            <Tooltip content={<PriceTip />} />
            {/* Open price */}
            <ReferenceLine y={startPrice} stroke="rgba(255,255,255,0.1)" strokeDasharray="5 5" />
            {/* Average price */}
            <ReferenceLine y={avgPrice} stroke="rgba(124,90,240,0.35)" strokeDasharray="3 3" />
            <Area
              type="monotone" dataKey="price"
              stroke={color} strokeWidth={2.5}
              fill="url(#mktGrad)"
              dot={false} isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume chart */}
      <div style={{ height: 30, marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 0, right: 2, bottom: 0, left: 0 }}>
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Bar dataKey="vol" fill={`${color}40`} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
        {[
          { label: 'Open',     val: `$${startPrice.toFixed(2)}`,                          color: 'var(--text2)' },
          { label: 'High',     val: `$${Math.max(...marketHistory).toFixed(2)}`,           color: 'var(--green)' },
          { label: 'Low',      val: `$${Math.min(...marketHistory).toFixed(2)}`,           color: 'var(--red)' },
          { label: 'Avg',      val: `$${avgPrice.toFixed(2)}`,                             color: 'var(--purple)' },
          { label: 'Ticks',    val: marketHistory.length,                                  color: 'var(--muted)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
