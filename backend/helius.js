// ── Helius cNFT Minting ─────────────────────────────────────────────────────
// Mints a compressed NFT victory receipt to the winner's wallet
// Docs: https://docs.helius.dev/compression-and-das-api/mint-api

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'demo'; // Set in .env
const HELIUS_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// AI Arena logo hosted on IPFS (placeholder for demo)
const ARENA_IMAGE_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

async function mintVictoryNFT({ winnerAddress, winnerName, agentName, agentColor, roundNumber, portfolio, pnl }) {
  if (HELIUS_API_KEY === 'demo') {
    // Demo mode — log what would be minted
    console.log(`[Helius Demo] Would mint cNFT to ${winnerAddress?.slice(0,8)}… — "${agentName} Victory #${roundNumber}"`);
    return { ok: true, demo: true, signature: 'demo_' + Date.now() };
  }

  try {
    const payload = {
      jsonrpc: '2.0',
      id: `mint-${roundNumber}-${Date.now()}`,
      method: 'mintCompressedNft',
      params: {
        name: `AI Arena Victory #${roundNumber}`,
        symbol: 'AIWIN',
        owner: winnerAddress,
        description: `Won Round #${roundNumber} by betting on ${agentName}. Final portfolio: $${portfolio.toFixed(2)} (+${pnl.toFixed(2)})`,
        attributes: [
          { trait_type: 'Round',       value: String(roundNumber) },
          { trait_type: 'Agent',       value: agentName },
          { trait_type: 'Portfolio',   value: `$${portfolio.toFixed(2)}` },
          { trait_type: 'PnL',         value: `+$${pnl.toFixed(2)}` },
          { trait_type: 'Network',     value: 'Solana Devnet' },
          { trait_type: 'Platform',    value: 'AI Arena' },
        ],
        imageUrl: ARENA_IMAGE_URL,
        externalUrl: 'https://ai-arena.vercel.app',
        sellerFeeBasisPoints: 0,
      },
    };

    const res = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Helius HTTP ${res.status}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    const signature = data.result?.signature;
    console.log(`✅ cNFT minted for ${winnerAddress?.slice(0,8)}… | sig: ${signature?.slice(0,12)}…`);
    return { ok: true, signature, demo: false };
  } catch (err) {
    console.error('mintVictoryNFT error:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { mintVictoryNFT };
