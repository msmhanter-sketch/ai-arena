# AI Arena — On-Chain AI Agent Betting Platform

AI Arena is a real-time, Web3-native competitive trading simulation built on **Solana**. Watch six distinct AI agents battle in a simulated SOL/USDC market, stake USDC on your favorite strategy, and earn on-chain payouts and Compressed NFT (cNFT) victory receipts when your bot wins.

Built for the **Colosseum Frontier Hackathon**.

![AI Arena Dashboard](./frontend/public/preview.png)

---

## 🏆 Hackathon Tracks

AI Arena is specifically designed to hit the core requirements of two major hackathon tracks:

### 1. DeFi / Gaming Track (Solana Core)
- **On-Chain Escrow & Payouts:** Bets are verified against the Solana Devnet via RPC (`getTransaction`). Once verified, funds are locked in the Arena Escrow.
- **Automated Settlement:** When a 2-minute trading round ends, the backend calculates the prize pool distribution and automatically signs and sends `SystemProgram.transfer` transactions to the winners.
- **Real-Time Web3 UX:** Zero-jank WebSocket architecture combined with Phantom Wallet adapter for instant betting feedback.
- **Integrated Faucet:** Built-in devnet airdrop button (`/airdrop` API) for seamless testing by judges.

### 2. Metaforra Track (Utility & Tokenization)
- **Victory Receipts (cNFTs):** Winning isn't just about P&L. Every user who correctly bets on the winning AI agent automatically receives a **Compressed NFT (cNFT)** minted directly to their wallet via the **Helius API**.
- **Immutable Bragging Rights:** The cNFT metadata contains the specific round number, the winning agent's name, and the final portfolio size, tokenizing the user's trading success.

---

## 🏗️ Architecture

### Frontend (Vite + React)
- **Tech Stack:** React 18, Vite, Recharts, Vanilla CSS (Glassmorphism design system).
- **Web3:** `@solana/wallet-adapter-react`, `@solana/web3.js` (with Vite node-polyfills for Buffer support).
- **Features:** Procedural Web Audio API sound effects, Agent strategy inspection modals, real-time interactive market charts, and user P&L tracking.

### Backend (Node.js + WebSockets)
- **Tech Stack:** Express, `ws` (WebSockets), `@solana/web3.js`.
- **Game Loop:** A precise 1-second tick loop simulating market volatility and agent trading decisions based on predefined algorithms (e.g., Momentum, Mean Reversion, High-Frequency).
- **Security:** Deep RPC verification to prevent front-running or fake "signed" bets.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Phantom Wallet browser extension (switched to Devnet)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/ai-arena.git
cd ai-arena

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Copy the `.env.example` files in both the frontend and backend directories to `.env`.

**Backend (`backend/.env`):**
```env
PORT=3001
HELIUS_API_KEY=your_helius_api_key_here # For cNFT minting (Metaforra Track)
SOLANA_NETWORK=devnet
```

**Frontend (`frontend/.env`):**
```env
VITE_BACKEND_URL=http://localhost:3001
```

### 3. Run the Platform
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
node server.js
# This will automatically generate a persistent 'escrow-keypair.json' for the house wallet.
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser. Connect your Phantom wallet, use the built-in Airdrop button if you need Devnet SOL, and place your bets!

---

## 🛡️ License
MIT License
