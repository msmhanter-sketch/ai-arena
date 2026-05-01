import { useState, useEffect, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

function truncate(pk) {
  const s = pk.toString();
  return `${s.slice(0,4)}…${s.slice(-4)}`;
}

export default function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection?.() ?? {};
  const [balance,    setBalance]    = useState(null);
  const [menu,       setMenu]       = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [airdropMsg,  setAirdropMsg]  = useState(null);
  const menuRef = useRef(null);

  // Fetch SOL balance
  useEffect(() => {
    if (!connected || !publicKey || !connection) { setBalance(null); return; }
    let active = true;
    const poll = () => connection.getBalance(publicKey).then(b => { if (active) setBalance(b / LAMPORTS_PER_SOL); }).catch(() => {});
    poll();
    const t = setInterval(poll, 8000);
    return () => { active = false; clearInterval(t); };
  }, [connected, publicKey, connection]);

  // Close on outside click
  useEffect(() => {
    if (!menu) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  // Request devnet airdrop
  const requestAirdrop = async () => {
    if (!publicKey || airdropping) return;
    setAirdropping(true);
    setAirdropMsg(null);
    try {
      const res = await fetch('http://localhost:3001/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (data.ok) {
        setAirdropMsg({ ok: true, text: '+1 SOL received!' });
        // Refresh balance
        if (connection) connection.getBalance(publicKey).then(b => setBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
      } else {
        setAirdropMsg({ ok: false, text: data.error ?? 'Airdrop failed' });
      }
    } catch {
      setAirdropMsg({ ok: false, text: 'Network error' });
    } finally {
      setAirdropping(false);
      setTimeout(() => setAirdropMsg(null), 4000);
    }
  };

  // ── Modal trigger ──────────────
  const { setVisible } = useWalletModal();

  // ── Not connected ────────────────────────────────────────────────────
  if (!connected) {
    return (
      <button className="btn btn-wallet" onClick={() => setVisible(true)} id="connect-wallet-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 12h.01M2 7V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/>
        </svg>
        Connect Wallet
      </button>
    );
  }

  // ── Connected ────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button className="btn btn-wallet" onClick={() => setMenu(m => !m)} id="wallet-connected-btn" style={{ gap: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 1.4s infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}>{truncate(publicKey)}</span>
        {balance !== null && (
          <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(124,90,240,0.14)', color: 'var(--purple)', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
            {balance.toFixed(3)} SOL
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5, transform: menu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {menu && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 14, padding: 8, minWidth: 230, zIndex: 9999, animation: 'slide-up 0.2s ease', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
          {/* Address */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Connected Address</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text2)', wordBreak: 'break-all' }}>{publicKey.toString()}</div>
          </div>
          {/* Balance */}
          {balance !== null && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(124,90,240,0.06)', border: '1px solid rgba(124,90,240,0.15)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Balance (Devnet)</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--purple)', fontSize: 13 }}>{balance.toFixed(4)} SOL</span>
            </div>
          )}
          {/* Airdrop */}
          <button
            onClick={requestAirdrop}
            disabled={airdropping}
            style={{ width: '100%', padding: '9px 12px', background: airdropping ? 'rgba(45,206,142,0.04)' : 'rgba(45,206,142,0.08)', border: '1px solid rgba(45,206,142,0.2)', borderRadius: 8, color: 'var(--green)', cursor: airdropping ? 'not-allowed' : 'pointer', textAlign: 'left', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, transition: 'all 0.15s' }}
          >
            {airdropping
              ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(45,206,142,0.3)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Requesting 1 SOL…</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>Devnet Airdrop (+1 SOL)</>
            }
          </button>
          {/* Airdrop result */}
          {airdropMsg && (
            <div style={{ fontSize: 11, textAlign: 'center', color: airdropMsg.ok ? 'var(--green)' : 'var(--red)', padding: '4px 0', fontWeight: 600 }}>
              {airdropMsg.text}
            </div>
          )}
          {/* Disconnect */}
          <button
            onClick={() => { disconnect(); setMenu(false); }}
            style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: 'var(--red)', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,96,112,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
