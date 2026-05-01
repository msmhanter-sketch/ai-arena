import { useEffect, useState } from 'react';

export default function NewsEventBanner({ newsEvent }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!newsEvent) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 7000);
    return () => clearTimeout(t);
  }, [newsEvent]);

  if (!show || !newsEvent) return null;

  const palette = {
    bullish:  { bg: 'rgba(45,206,142,0.08)',  border: 'rgba(45,206,142,0.3)',  text: '#2dce8e', label: 'BULLISH' },
    bearish:  { bg: 'rgba(240,96,112,0.08)',  border: 'rgba(240,96,112,0.3)',  text: '#f06070', label: 'BEARISH' },
    volatile: { bg: 'rgba(240,180,41,0.08)',  border: 'rgba(240,180,41,0.3)',  text: '#f0b429', label: 'VOLATILE' },
  };
  const p = palette[newsEvent.type] ?? palette.volatile;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 18px', borderRadius: 12,
      background: p.bg, border: `1px solid ${p.border}`,
      animation: 'news-drop 0.45s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: `0 0 24px ${p.border}40`,
    }}>
      {/* Type label */}
      <div style={{
        fontSize: 8.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
        background: `${p.text}18`, color: p.text,
        border: `1px solid ${p.text}30`, letterSpacing: '0.1em', flexShrink: 0,
      }}>
        {p.label}
      </div>
      {/* Live dot */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.text, animation: 'pulse-dot 0.9s infinite', flexShrink: 0 }} />
      {/* Message */}
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>
        {newsEvent.text}
      </span>
      {/* Timestamp */}
      <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, fontFamily: 'JetBrains Mono' }}>NOW</span>
    </div>
  );
}
