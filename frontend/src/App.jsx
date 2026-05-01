import { useState, useEffect, useRef } from 'react';
import WalletButton          from './components/WalletButton';
import AgentModal            from './components/AgentModal';
import UserStats             from './components/UserStats';
import { useArena }          from './hooks/useArena';
import { play, toggleMute, isMuted } from './hooks/useSounds';
import AgentCard             from './components/AgentCard';
import MarketChart           from './components/MarketChart';
import BettingPanel          from './components/BettingPanel';
import Leaderboard           from './components/Leaderboard';
import EventFeed             from './components/EventFeed';
import Timer                 from './components/Timer';
import BattleBar             from './components/BattleBar';
import NewsEventBanner       from './components/NewsEventBanner';
import RoundResultOverlay    from './components/RoundResultOverlay';

const Spinner = () => (
  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

export default function App() {
  const {
    connected, tick, round, overallWins, roundHistory,
    bettingLocked, myBet, lastResult, showResult, toasts,
    newsEvent, odds, totalPrizePool, escrowAddress, betStatus,
    walletConnected, walletAddress, userId,
    placeBet, dismissResult,
  } = useArena();

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [modalAgent,    setModalAgent]    = useState(null);
  const [muted,         setMuted]         = useState(isMuted());
  const prevBettingLocked = useRef(false);
  const prevRound         = useRef(0);
  const prevResult        = useRef(null);

  const agents = tick?.agents ?? [];
  const sorted = [...agents].sort((a, b) => b.portfolio - a.portfolio);

  // ── Sound triggers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!tick) return;
    if (tick.bettingLocked && !prevBettingLocked.current) {
      // No sound on lock — too frequent
    }
    prevBettingLocked.current = tick.bettingLocked;
  }, [tick?.bettingLocked]);

  useEffect(() => {
    if (round > 0 && round !== prevRound.current) {
      play('roundStart');
      prevRound.current = round;
    }
  }, [round]);

  useEffect(() => {
    if (showResult && lastResult && lastResult !== prevResult.current) {
      const myResult = Object.values(lastResult.betResults ?? {})[0];
      if (myResult?.won) play('win');
      else if (myResult) play('lose');
      prevResult.current = lastResult;
    }
  }, [showResult, lastResult]);

  useEffect(() => {
    if (newsEvent) play('news');
  }, [newsEvent]);

  useEffect(() => {
    if (myBet) play('bet');
  }, [myBet]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(3,3,10,0.92)', backdropFilter: 'blur(28px)', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #7c5af0, #1dc8e4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(124,90,240,0.5)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"/>
                <circle cx="9" cy="16" r="1" fill="#fff" stroke="none"/>
                <circle cx="15" cy="16" r="1" fill="#fff" stroke="none"/>
                <path d="M12 11V8"/><circle cx="12" cy="6" r="2"/>
                <path d="M6 11v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-0.04em', lineHeight: 1 }}>AI <span className="gradient-text">ARENA</span></div>
              <div style={{ fontSize: 8.5, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>on Solana</div>
            </div>
          </div>

          {/* Timer */}
          {tick
            ? <Timer timeLeft={tick.timeLeft} bettingLocked={tick.bettingLocked} round={tick.round} />
            : <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: 13 }}><Spinner />Connecting…</div>
          }

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            {tick && (
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Market</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 15 }}>${tick.marketPrice?.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Pool</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 15, color: 'var(--green)' }}>${totalPrizePool.toFixed(0)}</div>
                </div>
              </div>
            )}

            {/* Mute button */}
            <button
              onClick={() => { setMuted(toggleMute()); }}
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
              style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted ? 'var(--muted)' : 'var(--text2)', transition: 'all 0.15s' }}
            >
              {muted
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              }
            </button>

            {/* WS status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: connected ? 'rgba(45,206,142,0.08)' : 'rgba(240,96,112,0.08)', border: `1px solid ${connected ? 'rgba(45,206,142,0.22)' : 'rgba(240,96,112,0.22)'}`, fontSize: 11.5, fontWeight: 700, color: connected ? 'var(--green)' : 'var(--red)' }}>
              <div className={`dot dot-${connected ? 'green' : 'red'}`} />
              {connected ? 'Live' : 'Reconnecting'}
            </div>

            <WalletButton />
          </div>
        </div>
      </header>

      {/* ── Ticker tape ──────────────────────────────────────────────── */}
      {agents.length > 0 && (
        <div style={{ background: 'rgba(124,90,240,0.05)', borderBottom: '1px solid rgba(124,90,240,0.1)', padding: '6px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 44, animation: 'ticker 28s linear infinite', width: 'max-content' }}>
            {[...sorted, ...sorted].map((a, i) => (
              <span key={i} style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--muted)', fontSize: 9 }}>#{(i % sorted.length) + 1}</span>
                <span style={{ color: '#8896b0' }}>{a.name}</span>
                <span style={{ color: '#dde4f0', fontWeight: 700 }}>${a.portfolio.toFixed(0)}</span>
                <span style={{ color: a.pnlPct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{a.pnlPct >= 0 ? '+' : ''}{a.pnlPct.toFixed(2)}%</span>
                <span style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 1440, margin: '0 auto', padding: '18px 28px', width: '100%' }}>

        {!connected && !tick && (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 24px', border: '3px solid rgba(124,90,240,0.2)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Launching AI Arena</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Connecting to backend on port 3001…</div>
          </div>
        )}

        {tick && (
          <div className="main-grid">

            {/* ── Left column ─────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {newsEvent && <NewsEventBanner key={newsEvent._id} newsEvent={newsEvent} />}

              <MarketChart
                marketHistory={tick.marketHistory}
                marketVolume={tick.marketVolume}
                marketPrice={tick.marketPrice}
              />

              <BattleBar agents={sorted} />

              <div>
                <div className="section-label">Battle Participants <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>— click for details</span></div>
                <div className="agent-grid">
                  {sorted.map((agent, i) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      rank={i}
                      isMyBet={myBet?.agentId === agent.id}
                      selected={selectedAgent === agent.id}
                      onClick={() => {
                        setSelectedAgent(p => p === agent.id ? null : agent.id);
                        setModalAgent(agent);
                      }}
                    />
                  ))}
                </div>
              </div>

              <EventFeed events={tick.eventFeed ?? []} />
            </div>

            {/* ── Right sidebar ────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <BettingPanel
                agents={sorted}
                bettingLocked={bettingLocked}
                myBet={myBet}
                odds={odds}
                walletConnected={walletConnected}
                betStatus={betStatus}
                escrowAddress={escrowAddress}
                onBet={(agentId, amount) => { setSelectedAgent(agentId); placeBet(agentId, amount); }}
              />

              <UserStats
                userId={userId}
                roundHistory={roundHistory}
                myBet={myBet}
                walletAddress={walletAddress}
              />

              <Leaderboard
                overallWins={overallWins}
                agents={sorted}
                roundHistory={roundHistory}
                totalPrizePool={totalPrizePool}
              />

              <div className="glass" style={{ padding: '18px 20px' }}>
                <div className="section-label">About</div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 14 }}>
                  Six AI agents with distinct trading strategies battle in a real-time market simulation.
                  Stake USDC before bets lock, watch the fight, and earn from the prize pool if your bot wins.
                  Winners receive on-chain payouts and cNFT victory receipts on Solana Devnet.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Solana', 'AI Agents', 'DeFi', 'cNFTs', 'Devnet'].map(t => (
                    <span key={t} style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'rgba(124,90,240,0.1)', color: 'var(--purple)', border: '1px solid rgba(124,90,240,0.2)', letterSpacing: '0.04em' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Toasts ──────────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      {/* ── Agent modal ──────────────────────────────────────────────── */}
      {modalAgent && (
        <AgentModal
          agent={sorted.find(a => a.id === modalAgent.id) ?? modalAgent}
          onClose={() => setModalAgent(null)}
        />
      )}

      {/* ── Round result overlay ─────────────────────────────────────── */}
      {showResult && (
        <RoundResultOverlay
          result={lastResult}
          agents={sorted}
          myBet={myBet}
          onClose={dismissResult}
        />
      )}
    </div>
  );
}
