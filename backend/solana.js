// ── Solana Integration Layer ────────────────────────────────────────────────
// Handles escrow wallet, transaction verification, and winner payouts
const { Connection, Keypair, PublicKey, Transaction, SystemProgram,
        LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs   = require('fs');
const path = require('path');

const RPC_URL     = 'https://api.devnet.solana.com';
const connection  = new Connection(RPC_URL, 'confirmed');

// ── Escrow keypair (persisted to disk so funds survive restarts) ────────────
const ESCROW_PATH = path.join(__dirname, '.escrow-keypair.json');
let escrowKeypair;

if (fs.existsSync(ESCROW_PATH)) {
  const raw = JSON.parse(fs.readFileSync(ESCROW_PATH, 'utf8'));
  escrowKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
} else {
  escrowKeypair = Keypair.generate();
  fs.writeFileSync(ESCROW_PATH, JSON.stringify(Array.from(escrowKeypair.secretKey)));
}

const ESCROW_PUBKEY = escrowKeypair.publicKey;
console.log(`🔑 Escrow wallet: ${ESCROW_PUBKEY.toBase58()}`);

// ── Verify a SOL transfer tx ────────────────────────────────────────────────
// Checks that the given signature is a confirmed transfer TO our escrow
async function verifyBetTransaction(signature, expectedFrom, expectedLamports) {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || tx.meta?.err) return { ok: false, reason: 'Transaction failed or not found' };

    // Check it was sent to our escrow
    const accountKeys = tx.transaction.message.staticAccountKeys
      ?? tx.transaction.message.accountKeys;

    const escrowStr = ESCROW_PUBKEY.toBase58();
    const fromStr   = expectedFrom;

    let foundTransfer = false;
    const pre  = tx.meta.preBalances;
    const post = tx.meta.postBalances;

    for (let i = 0; i < accountKeys.length; i++) {
      const key = accountKeys[i].toBase58 ? accountKeys[i].toBase58() : accountKeys[i].toString();
      if (key === escrowStr) {
        const received = post[i] - pre[i];
        if (received >= expectedLamports * 0.98) { // 2% tolerance for rounding
          foundTransfer = true;
          break;
        }
      }
    }

    if (!foundTransfer) return { ok: false, reason: 'Transfer to escrow not found in tx' };
    return { ok: true };
  } catch (err) {
    console.error('verifyBetTransaction error:', err.message);
    return { ok: false, reason: err.message };
  }
}

// ── Send payout from escrow to winner ───────────────────────────────────────
async function sendPayout(recipientPubkey, lamports) {
  try {
    const recipient = new PublicKey(recipientPubkey);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: ESCROW_PUBKEY,
        toPubkey:   recipient,
        lamports:   Math.floor(lamports),
      })
    );
    const sig = await sendAndConfirmTransaction(connection, tx, [escrowKeypair], {
      commitment: 'confirmed',
    });
    console.log(`💸 Payout ${(lamports/LAMPORTS_PER_SOL).toFixed(4)} SOL → ${recipientPubkey.slice(0,8)}… | sig: ${sig.slice(0,12)}…`);
    return { ok: true, signature: sig };
  } catch (err) {
    console.error('sendPayout error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── Get escrow balance ──────────────────────────────────────────────────────
async function getEscrowBalance() {
  try {
    const bal = await connection.getBalance(ESCROW_PUBKEY);
    return bal / LAMPORTS_PER_SOL;
  } catch { return 0; }
}

module.exports = {
  connection,
  escrowKeypair,
  ESCROW_PUBKEY,
  LAMPORTS_PER_SOL,
  verifyBetTransaction,
  sendPayout,
  getEscrowBalance,
};
