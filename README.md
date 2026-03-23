# Multiplayer Tic-Tac-Toe with Nakama

A full-stack multiplayer Tic-Tac-Toe game with a server-authoritative backend powered by Nakama (TypeScript) and a responsive, beautiful frontend powered by React (Vite+TS).

## Features
- **Server-Authoritative Validation**: All move logic is validated on the backend. Clients cannot cheat.
- **Matchmaking**: Built-in Nakama matchmaking seamlessly connects players.
- **Turn Timers**: Built-in turn timers (30 seconds) on the server. If a player fails to move within the deadline, they instantly forfeit the match.
- **Leaderboards**: Dedicated `tictactoe_wins` leaderboard tracking the top players globally.
- **Premium UI**: Uses advanced CSS animations, glowing gradients, and glassmorphism styling for an impressive aesthetic tailored to modern web requirements.

## Architecture

1. **Backend** (`/tic-tac-toe-backend`):
   - Uses standard `heroiclabs/nakama` container linked to a single-node `cockroachdb`.
   - The game logic runs in Nakama's embedded JavaScript runtime, written originally in TypeScript.
   - Using Rollup, the TypeScript code is bundled into a single `/build/index.js` file which Nakama automatically loads.
   - The match logic (`src/match_handler.ts`) utilizes the `nkx.Match` interface and stores strict state like marks, board size, timer deadlines, and winners.
   - Nakama RPCs are abstracted out; instead, standard built-in Matchmaking is used via the `MatchmakerMatched` hook.

2. **Frontend** (`/tic-tac-toe-frontend`):
   - Built with React, Vite, CSS variables, and TypeScript.
   - Nakama Client via `@heroiclabs/nakama-js` provides `Device Authentication`, `Socket Connections`, and `Leaderboard Queries`.
   - The state machine transitions seamlessly between Login -> Menu -> Matchmaking -> Game.

## Installation & Deployment

### 1. Start the Backend server (Nakama)
```bash
cd tic-tac-toe-backend
npm install
npm run build
docker-compose up -d
```
*Note: Make sure Docker and Docker Compose are installed. This exposes Nakama on `http://127.0.0.1:7350` and the console on port `7351`.*

### 2. Start the Frontend client
```bash
cd tic-tac-toe-frontend
npm install
npm run dev
```
*The app will be running at `http://localhost:5173`. Open it in two different browser windows to play!*

## API / Server Configuration
- **Host**: localhost
- **Port**: 7350 (HTTP) / 7351 (Dashboard)
- **Dashboard Credentials**: `admin` / `password`
- **Socket Key**: `defaultkey` (Configured inside `local.yml` and explicitly invoked by React).

## How to test the multiplayer functionality
1. Get the game running locally on `http://localhost:5173`.
2. Open two separate browser modes (e.g. Normal and Incognito).
3. Log in with two different nicknames.
4. Click "Find Random Match" simultaneously on both screens.
5. Watch the state synchronise in real-time as moves execute! Try taking longer than 30s to see the automatic forfeit mechanic.

Enjoy the application!
