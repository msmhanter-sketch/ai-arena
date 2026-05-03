import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export function useArena() {
  const ws          = useRef(null);
  const userId      = useRef(`user_${Math.random().toString(36).slice(2,9)}`);
  const reconnT     = useRef(null);

  // Wallet hooks
  const wallet     = useWallet();
  const connHook   = useConnection();
  const solConnection = connHook?.connection ?? null;

  const [connected,      setConnected]      = useState(false);
  const [tick,           setTick]           = useState(null);
  const [round,          setRound]          = useState(0);
  const [overallWins,    setOverallWins]    = useState({});
  const [roundHistory,   setRoundHistory]   = useState([]);
  const [bettingLocked,  setBettingLocked]  = useState(false);
  const [myBet,          setMyBet]          = useState(null);
  const [lastResult,     setLastResult]     = useState(null);
  const [showResult,     setShowResult]     = useState(false);
  const [toasts,         setToasts]         = useState([]);
  const [newsEvent,      setNewsEvent]      = useState(null);
  const [odds,           setOdds]           = useState({});
  const [totalPrizePool, setTotalPrizePool] = useState(0);
  const [escrowAddress,  setEscrowAddress]  = useState(null);
  const [betStatus,      setBetStatus]      = useState(null); // null | 'signing' | 'sending' | 'verifying' | 'confirmed'

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    const socket = new WebSocket(WS_URL);

    socket.onopen  = () => { setConnected(true); clearTimeout(reconnT.current); };
    socket.onclose = () => {
      setConnected(false);
      reconnT.current = setTimeout(connect, 3000);
    };
    socket.onerror = () => socket.close();

    socket.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        switch (msg.type) {
          case 'INIT':
            setRound(msg.data.round);
            setOverallWins(msg.data.overallWins || {});
            setRoundHistory(msg.data.roundHistory || []);
            setTotalPrizePool(msg.data.totalPrizePool || 0);
            if (msg.data.escrowAddress) setEscrowAddress(msg.data.escrowAddress);
            break;
          case 'TICK':
            setTick(msg.data);
            setRound(msg.data.round);
            setOverallWins(msg.data.overallWins);
            setRoundHistory(msg.data.roundHistory || []);
            setBettingLocked(msg.data.bettingLocked);
            setOdds(msg.data.odds || {});
            setTotalPrizePool(msg.data.totalPrizePool || 0);
            break;
          case 'BETTING_LOCKED':
            setBettingLocked(true);
            addToast('Betting locked — watch the battle!', 'info');
            break;
          case 'ROUND_START':
            setBettingLocked(false);
            setMyBet(null);
            setShowResult(false);
            setLastResult(null);
            setOdds({});
            setBetStatus(null);
            addToast(`Round #${msg.round} started! Place your bets.`, 'info');
            break;
          case 'ROUND_END':
            setLastResult(msg.data);
            setShowResult(true);
            setTotalPrizePool(msg.data.totalPrizePool || 0);
            if (myBet) {
              const res = Object.values(msg.data.betResults ?? {})[0];
              if (res?.won) addToast(`You WON! +$${res.payout.toFixed(2)} USDC`, 'win');
              else if (res) addToast(`Your bot lost. Better luck next round!`, 'lose');
            }
            break;
          case 'BET_VERIFYING':
            setBetStatus('verifying');
            break;
          case 'BET_CONFIRMED':
            setMyBet({ agentId: msg.agentId, amount: msg.amount, onChain: msg.onChain, txSignature: msg.txSignature });
            setBetStatus('confirmed');
            addToast(msg.onChain ? `On-chain bet confirmed! $${msg.amount} USDC` : `Demo bet placed: $${msg.amount} USDC`, 'info');
            break;
          case 'BET_REJECTED':
            setBetStatus(null);
            addToast(`${msg.reason}`, 'lose');
            break;
          case 'NEWS_EVENT':
            setNewsEvent({ ...msg.data, _id: Date.now() });
            break;
          case 'ODDS_UPDATE':
            setOdds(msg.data || {});
            break;
          case 'PAYOUT_SENT':
            addToast(`On-chain payout sent: $${msg.amount} USDC`, 'win');
            break;
          case 'NFT_MINTED':
            if (msg.demo) addToast('Victory NFT receipt minted (demo)', 'info');
            else addToast('Victory cNFT minted to your wallet!', 'win');
            break;
        }
      } catch(e) {}
    };
    ws.current = socket;
  }, [addToast, myBet]);

  useEffect(() => { connect(); return () => { ws.current?.close(); clearTimeout(reconnT.current); }; }, []);

  // ── Place bet (on-chain if wallet connected, demo otherwise) ──────────
  const placeBet = useCallback(async (agentId, amount) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    if (bettingLocked) { addToast('Betting is locked!', 'lose'); return; }

    const walletConnected = wallet.connected && wallet.publicKey && wallet.sendTransaction && solConnection && escrowAddress;

    if (walletConnected) {
      // ── ON-CHAIN: create SOL transfer → sign → send → verify ──
      try {
        setBetStatus('signing');
        const escrowPK = new PublicKey(escrowAddress);

        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey:   escrowPK,
            lamports: Number(amount) * LAMPORTS_PER_SOL,
          })
        );
        
        const { blockhash } = await solConnection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey;

        setBetStatus('sending');
        const signature = await wallet.sendTransaction(tx, solConnection);
        await solConnection.confirmTransaction(signature, 'confirmed');

        // Send to backend with tx proof
        ws.current.send(JSON.stringify({
          type: 'PLACE_BET',
          userId: userId.current,
          agentId,
          amount,
          txSignature:   signature,
          walletAddress: wallet.publicKey.toBase58(),
        }));
      } catch (err) {
        setBetStatus(null);
        const msg = err?.message ?? 'Unknown error';
        if (msg.includes('User rejected')) {
          addToast('Transaction cancelled by user', 'lose');
        } else {
          addToast(`Transaction failed: ${msg.slice(0,60)}`, 'lose');
        }
      }
    } else {
      // ── DEMO MODE: no wallet, just send to backend ──
      ws.current.send(JSON.stringify({ type: 'PLACE_BET', userId: userId.current, agentId, amount }));
    }
  }, [bettingLocked, addToast, wallet, solConnection, escrowAddress]);

  return {
    connected, tick, round, overallWins, roundHistory,
    bettingLocked, myBet, lastResult, showResult, toasts,
    newsEvent, odds, totalPrizePool, escrowAddress, betStatus,
    walletConnected: !!(wallet.connected && wallet.publicKey),
    walletAddress: wallet.publicKey?.toBase58() ?? null,
    userId: userId.current,
    placeBet,
    dismissResult: () => setShowResult(false),
  };
}
