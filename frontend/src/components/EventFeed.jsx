import { useRef, useEffect } from 'react';

export default function EventFeed({ events = [] }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [events.length]);

  return (
    <div className="glass" style={{ padding: '18px 22px' }}>
      <div className="section-label">Live Feed</div>
      <div ref={ref} style={{ height: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {events.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', paddingTop: 16 }}>Waiting for events…</div>
        ) : events.map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 10px', borderRadius: 7,
            background: i === 0 ? 'rgba(255,255,255,0.035)' : 'transparent',
            border: i === 0 ? `1px solid ${e.color ?? 'rgba(255,255,255,0.06)'}20` : '1px solid transparent',
            animation: i === 0 ? 'slide-up 0.3s ease' : 'none',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: e.color ?? 'var(--muted)', marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: i === 0 ? (e.color ?? 'var(--text)') : 'var(--text2)', lineHeight: 1.55, flex: 1 }}>
              {e.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
