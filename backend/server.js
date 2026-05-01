const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { ESCROW_PUBKEY, LAMPORTS_PER_SOL, verifyBetTransaction, sendPayout, getEscrowBalance, connection } = require('./solana');
const { mintVictoryNFT } = require('./helius');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const AGENTS = [
  { id: 'alpha',   name: 'AlphaBot',   emoji: '⚡', color: '#8b5cf6', strategy: 'momentum',   desc: 'Aggressive momentum trader', tag: 'HIGH RISK' },
  { id: 'neural',  name: 'NeuralBot',  emoji: '🧠', color: '#22d3ee', strategy: 'neural',     desc: 'ML moving-average crossover', tag: 'SMART' },
  { id: 'chaos',   name: 'ChaosBot',   emoji: '🎲', color: '#fbbf24', strategy: 'chaos',      desc: 'Pure entropy engine', tag: 'WILDCARD' },
  { id: 'arbi',    name: 'ArbiBot',    emoji: '⚖️', color: '#34d399', strategy: 'arbitrage',  desc: 'Exploits micro-inefficiencies', tag: 'STABLE' },
  { id: 'steady',  name: 'SteadiBot',  emoji: '🛡️', color: '#f472b6', strategy: 'dca',        desc: 'Dollar-cost averaging bot', tag: 'SAFE' },
  { id: 'phoenix', name: 'PhoenixBot', emoji: '🔥', color: '#f87171', strategy: 'contrarian', desc: 'Buys fear, sells greed', tag: 'CONTRARIAN' },
];

const NEWS_EVENTS = [
  { text: 'Whale Alert: Massive buy order sweeping the order book!', impact: 4.5, type: 'bullish' },
  { text: 'Flash Crash: Cascading liquidations across all pairs!', impact: -5.5, type: 'bearish' },
  { text: 'Breakout! Price punching through key resistance level!', impact: 3.5, type: 'bullish' },
  { text: 'Bear Trap: Shorts getting obliterated by the squeeze!', impact: 3, type: 'bullish' },
  { text: 'Institutional Flow: Major fund accumulating position!', impact: 2.5, type: 'bullish' },
  { text: 'EXTREME FEAR: Panic selling floods the market!', impact: -4.5, type: 'bearish' },
  { text: 'Diamond Hands: Top wallets refuse to capitulate!', impact: 2, type: 'bullish' },
  { text: 'Volatility Explosion: All bots going into overdrive!', impact: 0, type: 'volatile' },
  { text: 'Support Reclaimed: Bulls seizing control again!', impact: 3, type: 'bullish' },
  { text: 'Profit-Taking Wave: Resistance wall holding strong!', impact: -3, type: 'bearish' },
  { text: 'Volume Surge: Unusual on-chain activity detected!', impact: 2, type: 'volatile' },
  { text: 'FOMO Ignited: Retail rushing into the market!', impact: 3.5, type: 'bullish' },
  { text: 'Ice Age: Market freezes as liquidity drains!', impact: -2.5, type: 'bearish' },
  { text: 'Black Swan Alert: Unexpected macro event incoming!', impact: -6, type: 'bearish' },
  { text: 'To The Moon: Parabolic move initiated!', impact: 5, type: 'bullish' },
];

let marketPrice   = 100;
let marketHistory = [100];
let marketVolume  = [];
let roundNumber   = 0;
let roundStartTime;
let bettingLocked  = false;
let agentStates    = {};
let bets           = {};  // { userId: { agentId, amount, walletAddress, txSignature, verified } }
let roundHistory   = [];
let overallWins    = {};
let overallEarnings = {};
let userStats      = {};  // { userId: { wins, losses, totalBet, totalPayout, streak } }
let roundEnding    = false;
let eventFeed      = [];
let currentNews    = null;
let newsTimer      = 0;
let nextNewsIn     = randomNewsInterval();
let totalPrizePool = 0;
let volatility     = 0.018;

function randomNewsInterval() { return 20 + Math.floor(Math.random() * 20); }

function addEvent(text, color = '#e2e8f0', icon = '•') {
  eventFeed.unshift({ text, color, icon, ts: Date.now() });
  if (eventFeed.length > 40) eventFeed.pop();
}

function initAgents() {
  agentStates = {};
  AGENTS.forEach(a => {
    agentStates[a.id] = {
      ...a,
      portfolio: 1000, cash: 600, tokens: 4,
      trades: 0, wins: overallWins[a.id] || 0,
      history: [1000], lastAction: 'HOLD',
      pnl: 0, pnlPct: 0, mood: 'neutral',
      streak: 0, confidence: 50,
      tradeLog: [], // full trade history for modal
    };
  });
  eventFeed = []; volatility = 0.018;
  currentNews = null; newsTimer = 0; nextNewsIn = randomNewsInterval();
}

function tickMarket(elapsed) {
  const progress = elapsed / 120000;
  const dynamicVol = volatility * (1 + progress * 0.8);
  const mean = 100;
  const mr   = (mean - marketPrice) * 0.006;
  let shock  = (Math.random() - 0.48) * 2 * marketPrice * dynamicVol;
  if (currentNews) {
    shock += (currentNews.impact / 100) * marketPrice * 0.4;
    currentNews.remaining--;
    if (currentNews.remaining <= 0) currentNews = null;
  }
  marketPrice = Math.max(10, marketPrice + mr + shock);
  marketHistory.push(+marketPrice.toFixed(2));
  marketVolume.push(+(Math.abs(shock) * 10).toFixed(1));
  if (marketHistory.length > 120) marketHistory.shift();
  if (marketVolume.length > 120) marketVolume.shift();
}

function fireNewsEvent() {
  const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
  currentNews = { ...event, remaining: 5 };
  const color = event.type === 'bullish' ? '#34d399' : event.type === 'bearish' ? '#f87171' : '#fbbf24';
  addEvent(event.text, color, event.type === 'bullish' ? '📈' : event.type === 'bearish' ? '📉' : '⚡');
  broadcast({ type: 'NEWS_EVENT', data: { ...event, color } });
  volatility = Math.min(0.04, volatility * 1.3);
}

function decide(agent, state, elapsed) {
  const h = marketHistory;
  const p = marketPrice;
  const timeLeft = 120000 - elapsed;
  const urgency = timeLeft < 30000;
  let action = 'HOLD', amount = 0;

  switch (agent.strategy) {
    case 'momentum': {
      if (h.length >= 5) {
        const d = h[h.length-1] - h[h.length-5];
        const mult = urgency ? 0.5 : 0.35;
        if (d > 0.6 && state.cash > 30)    { action = 'BUY';  amount = state.cash * mult; }
        else if (d < -0.6 && state.tokens > 0) { action = 'SELL'; amount = state.tokens * 0.5; }
      }
      if (currentNews?.type === 'bullish' && state.cash > 30) { action = 'BUY'; amount = state.cash * 0.4; }
      if (currentNews?.type === 'bearish' && state.tokens > 0) { action = 'SELL'; amount = state.tokens * 0.6; }
      break;
    }
    case 'neural': {
      if (h.length >= 20) {
        const ma5  = h.slice(-5).reduce((a,b)=>a+b)/5;
        const ma20 = h.slice(-20).reduce((a,b)=>a+b)/20;
        if (ma5 > ma20*1.002 && state.cash > 30)     { action = 'BUY';  amount = state.cash * 0.28; }
        else if (ma5 < ma20*0.998 && state.tokens > 0) { action = 'SELL'; amount = state.tokens * 0.4; }
      }
      break;
    }
    case 'chaos': {
      const r = Math.random();
      if (r < 0.3 && state.cash > 30)     { action = 'BUY';  amount = state.cash * (0.1 + Math.random()*0.4); }
      else if (r < 0.52 && state.tokens > 0) { action = 'SELL'; amount = state.tokens * Math.random() * 0.6; }
      break;
    }
    case 'arbitrage': {
      if (h.length >= 10) {
        const ma = h.slice(-10).reduce((a,b)=>a+b)/10;
        if (p < ma*0.988 && state.cash > 30) { action = 'BUY';  amount = state.cash * 0.22; }
        else if (p > ma*1.012 && state.tokens > 0) { action = 'SELL'; amount = state.tokens * 0.33; }
      }
      break;
    }
    case 'dca': {
      if (state.trades % 8 === 0 && state.cash > 20) { action = 'BUY'; amount = Math.min(55, state.cash); }
      if (urgency && state.tokens > 0) { action = 'SELL'; amount = state.tokens * 0.3; }
      break;
    }
    case 'contrarian': {
      if (h.length >= 4) {
        const drop = h[h.length-4] - p;
        const rise = p - h[h.length-4];
        if (drop > 2.5 && state.cash > 30) { action = 'BUY';  amount = state.cash * 0.4; }
        else if (rise > 2.5 && state.tokens > 0) { action = 'SELL'; amount = state.tokens * 0.5; }
      }
      if (currentNews?.type === 'bearish' && state.cash > 30) { action = 'BUY'; amount = state.cash * 0.45; }
      break;
    }
  }
  return { action, amount };
}

function executeTrade(state, action, amount) {
  const p = marketPrice;
  const ts = Date.now();
  if (action === 'BUY' && amount > 0 && state.cash >= amount) {
    const t = amount / p;
    state.cash -= amount; state.tokens += t; state.trades++;
    state.lastAction = `BUY $${amount.toFixed(0)}`;
    state.tradeLog.push({ type: 'BUY', price: +p.toFixed(2), amount: +amount.toFixed(2), ts });
    if (state.tradeLog.length > 50) state.tradeLog.shift();
    addEvent(`${state.emoji} ${state.name} bought $${amount.toFixed(0)} @ $${p.toFixed(2)}`, state.color);
  } else if (action === 'SELL' && amount > 0 && state.tokens >= amount) {
    const cash = amount * p;
    state.tokens -= amount; state.cash += cash; state.trades++;
    state.lastAction = `SELL ${amount.toFixed(3)}`;
    state.tradeLog.push({ type: 'SELL', price: +p.toFixed(2), amount: +amount.toFixed(2), value: +cash.toFixed(2), ts });
    if (state.tradeLog.length > 50) state.tradeLog.shift();
    addEvent(`${state.emoji} ${state.name} sold ${amount.toFixed(2)} @ $${p.toFixed(2)}`, state.color);
  } else {
    state.lastAction = 'HOLD';
  }
  state.portfolio = state.cash + state.tokens * p;
  state.pnl    = state.portfolio - 1000;
  state.pnlPct = (state.pnl / 1000) * 100;
  state.history.push(+state.portfolio.toFixed(2));
  if (state.history.length > 120) state.history.shift();
  state.mood = state.pnlPct > 5 ? 'confident' : state.pnlPct < -5 ? 'nervous' : 'neutral';
  state.confidence = Math.min(100, Math.max(0, 50 + state.pnlPct * 2));
}

function getOdds() {
  const totalPool = Object.values(bets).reduce((s,b)=>s+b.amount,0);
  const result = {};
  AGENTS.forEach(a => {
    const agentPool = Object.values(bets).filter(b=>b.agentId===a.id).reduce((s,b)=>s+b.amount,0);
    result[a.id] = { odds: agentPool>0 ? +(totalPool/agentPool).toFixed(2) : null, pool: agentPool };
  });
  return { perAgent: result, total: totalPool, count: Object.keys(bets).length };
}

function getWinner() {
  return Object.entries(agentStates).sort((a,b)=>b[1].portfolio-a[1].portfolio)[0][0];
}

function settleBets(winnerId) {
  const totalPool  = Object.values(bets).reduce((s,b)=>s+b.amount,0);
  const winnerPool = Object.values(bets).filter(b=>b.agentId===winnerId).reduce((s,b)=>s+b.amount,0);
  const results = {};
  totalPrizePool += totalPool;

  Object.entries(bets).forEach(([uid, bet]) => {
    const isWinner = bet.agentId === winnerId && winnerPool > 0;
    const payout   = isWinner ? +((bet.amount/winnerPool)*totalPool).toFixed(2) : 0;
    results[uid] = { won: isWinner, payout, bet: bet.amount, profit: +(payout - bet.amount).toFixed(2), walletAddress: bet.walletAddress };

    // Update user stats
    if (!userStats[uid]) userStats[uid] = { wins: 0, losses: 0, totalBet: 0, totalPayout: 0, streak: 0 };
    const s = userStats[uid];
    s.totalBet    += bet.amount;
    s.totalPayout += payout;
    if (isWinner) { s.wins++; s.streak++; overallEarnings[uid] = (overallEarnings[uid]||0) + (payout - bet.amount); }
    else          { s.losses++; s.streak = 0; }
  });

  // ── On-chain payouts + cNFT minting ─────────────────────────────────
  const winBot = AGENTS.find(a => a.id === winnerId);
  const winState = agentStates[winnerId];

  Object.entries(results).forEach(([uid, res]) => {
    if (!res.won) return;

    // SOL payout
    if (res.walletAddress && res.payout > 0) {
      const lamports = Math.floor(res.payout * LAMPORTS_PER_SOL * 0.001);
      sendPayout(res.walletAddress, lamports).then(r => {
        if (r.ok) broadcast({ type: 'PAYOUT_SENT', userId: uid, amount: res.payout, signature: r.signature });
      }).catch(() => {});
    }

    // cNFT victory receipt
    if (res.walletAddress) {
      mintVictoryNFT({
        winnerAddress: res.walletAddress,
        winnerName:    uid,
        agentName:     winBot?.name,
        agentColor:    winBot?.color,
        roundNumber,
        portfolio:     winState?.portfolio ?? 1000,
        pnl:           winState?.pnl ?? 0,
      }).then(r => {
        broadcast({ type: 'NFT_MINTED', userId: uid, signature: r.signature, demo: r.demo });
      }).catch(() => {});
    }
  });

  return { results, totalPool, winnerPool };
}

function startNewRound() {
  roundNumber++;
  roundStartTime = Date.now();
  bettingLocked  = false;
  roundEnding    = false;
  bets           = {};
  initAgents();
  marketPrice    = 85 + Math.random() * 30;
  marketHistory  = [marketPrice];
  marketVolume   = [0];
  addEvent(`🏁 Round #${roundNumber} started — Place your bets!`, '#8b5cf6');
  broadcast({ type: 'ROUND_START', round: roundNumber });
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

let tick = 0;
setInterval(() => {
  if (roundEnding) return;
  const elapsed = Date.now() - roundStartTime;

  if (elapsed >= 30000 && !bettingLocked) {
    bettingLocked = true;
    addEvent('Betting locked — Battle in progress!', '#fbbf24');
    broadcast({ type: 'BETTING_LOCKED' });
  }

  newsTimer++;
  if (newsTimer >= nextNewsIn) {
    fireNewsEvent();
    newsTimer = 0;
    nextNewsIn = randomNewsInterval();
  }

  if (elapsed >= 120000) {
    roundEnding = true;
    const winnerId = getWinner();
    const winBot   = AGENTS.find(a=>a.id===winnerId);
    overallWins[winnerId] = (overallWins[winnerId]||0) + 1;
    const { results, totalPool } = settleBets(winnerId);
    addEvent(`🏆 ${winBot.emoji} ${winBot.name} WINS Round #${roundNumber}!`, winBot.color);
    const result = {
      round: roundNumber, winner: winnerId,
      winnerName: winBot.name, winnerEmoji: winBot.emoji, winnerColor: winBot.color,
      finalStates: Object.fromEntries(Object.entries(agentStates).map(([k,v])=>[k,{
        portfolio: v.portfolio, pnl: v.pnl, pnlPct: v.pnlPct, trades: v.trades
      }])),
      betResults: results, totalPool, totalPrizePool,
    };
    roundHistory.unshift(result);
    if (roundHistory.length > 20) roundHistory.pop();
    broadcast({ type: 'ROUND_END', data: result });
    setTimeout(startNewRound, 7000);
    return;
  }

  tickMarket(elapsed);
  AGENTS.forEach(ag => {
    const state = agentStates[ag.id];
    const { action, amount } = decide(ag, state, elapsed);
    executeTrade(state, action, amount);
  });
  tick++;

  broadcast({
    type: 'TICK',
    data: {
      round: roundNumber, elapsed,
      timeLeft: Math.max(0, 120000 - elapsed),
      bettingLocked,
      marketPrice: +marketPrice.toFixed(2),
      marketHistory: marketHistory.slice(-60),
      marketVolume:  marketVolume.slice(-60),
      agents: Object.values(agentStates).map(a => ({
        id: a.id, name: a.name, emoji: a.emoji, color: a.color, desc: a.desc, tag: a.tag,
        portfolio: +a.portfolio.toFixed(2), pnl: +a.pnl.toFixed(2), pnlPct: +a.pnlPct.toFixed(2),
        lastAction: a.lastAction, trades: a.trades, history: a.history.slice(-60),
        mood: a.mood, confidence: a.confidence,
      })),
      odds: getOdds(),
      overallWins,
      eventFeed: eventFeed.slice(0, 20),
      roundHistory: roundHistory.slice(0, 5),
      totalPrizePool,
      currentNews: currentNews ? { text: currentNews.text, type: currentNews.type } : null,
    }
  });
}, 1000);

wss.on('connection', ws => {
  ws.send(JSON.stringify({
    type: 'INIT',
    data: {
      agents: AGENTS, round: roundNumber, overallWins,
      roundHistory: roundHistory.slice(0,5), totalPrizePool,
      escrowAddress: ESCROW_PUBKEY.toBase58(),
    }
  }));
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'PLACE_BET') {
        if (bettingLocked) {
          ws.send(JSON.stringify({ type: 'BET_REJECTED', reason: 'Betting is locked!' }));
          return;
        }

        // ── On-chain bet (with tx signature) ───────────────────────
        if (msg.txSignature && msg.walletAddress) {
          const expectedLamports = Math.floor(msg.amount * LAMPORTS_PER_SOL * 0.001);
          ws.send(JSON.stringify({ type: 'BET_VERIFYING', agentId: msg.agentId }));

          verifyBetTransaction(msg.txSignature, msg.walletAddress, expectedLamports)
            .then(result => {
              if (result.ok) {
                bets[msg.userId] = {
                  agentId: msg.agentId, amount: msg.amount,
                  walletAddress: msg.walletAddress,
                  txSignature: msg.txSignature, verified: true,
                };
                const agName = AGENTS.find(a=>a.id===msg.agentId)?.name;
                addEvent(`Someone bet $${msg.amount} on ${agName} (on-chain)`, '#2dce8e');
                ws.send(JSON.stringify({
                  type: 'BET_CONFIRMED', agentId: msg.agentId, amount: msg.amount,
                  onChain: true, txSignature: msg.txSignature,
                }));
                broadcast({ type: 'ODDS_UPDATE', data: getOdds() });
              } else {
                ws.send(JSON.stringify({ type: 'BET_REJECTED', reason: `Tx verification failed: ${result.reason}` }));
              }
            })
            .catch(() => {
              ws.send(JSON.stringify({ type: 'BET_REJECTED', reason: 'Transaction verification error' }));
            });
          return;
        }

        // ── Off-chain bet (demo mode, no wallet) ───────────────────
        bets[msg.userId] = { agentId: msg.agentId, amount: msg.amount, walletAddress: null, verified: false };
        const agName = AGENTS.find(a=>a.id===msg.agentId)?.name;
        addEvent(`Someone bet $${msg.amount} on ${agName} (demo)`, '#8896b0');
        ws.send(JSON.stringify({ type: 'BET_CONFIRMED', agentId: msg.agentId, amount: msg.amount, onChain: false }));
        broadcast({ type: 'ODDS_UPDATE', data: getOdds() });
      }
    } catch(e) { console.error('WS message error:', e.message); }
  });
});

app.get('/health',  (_,res) => res.json({ ok:true, round:roundNumber, totalPrizePool, escrow: ESCROW_PUBKEY.toBase58() }));
app.get('/history', (_,res) => res.json(roundHistory));
app.get('/agents',  (_,res) => res.json(Object.values(agentStates).map(a => ({ ...a, tradeLog: a.tradeLog }))));
app.get('/agent/:id/trades', (req,res) => {
  const state = agentStates[req.params.id];
  if (!state) return res.status(404).json({ error: 'Agent not found' });
  res.json({ id: state.id, name: state.name, tradeLog: state.tradeLog });
});
app.get('/escrow', async (_,res) => {
  const balance = await getEscrowBalance();
  res.json({ address: ESCROW_PUBKEY.toBase58(), balance, network: 'devnet' });
});
app.post('/airdrop', async (req,res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'address required' });
  try {
    const { PublicKey } = require('@solana/web3.js');
    const pubkey = new PublicKey(address);
    const sig = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, 'confirmed');
    res.json({ ok: true, signature: sig, amount: 1 });
  } catch(err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get('/stats/:userId', (req,res) => {
  const stats = userStats[req.params.userId] || { wins:0, losses:0, totalBet:0, totalPayout:0, streak:0 };
  res.json(stats);
});

startNewRound();
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🤖 AI Arena backend → http://localhost:${PORT}`));
