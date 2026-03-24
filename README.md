# 🎮 Real-Time Multiplayer Tic-Tac-Toe

This project is a real-time multiplayer Tic-Tac-Toe game built using Nakama as the game server and React for the frontend. It supports live matchmaking, synchronized gameplay between players, and a persistent leaderboard.

---

## 🚀 Live Application

Frontend (Game):
https://tic-tac-toe-nakama-iz69vuoey-yashvendra09s-projects.vercel.app

Backend (Nakama Server):
https://tic-tac-toe-nakama-ekfg.onrender.com

---

## ✨ Features

* Real-time multiplayer gameplay using WebSockets
* Automatic matchmaking for 2 players
* Turn-based game logic with server authority
* Timed matches
* Leaderboard storing global wins
* Device-based authentication (no signup required)
* Fully deployed frontend and backend

---

## 🧠 Architecture Overview

The system is split into three main components:

1. **Frontend (React + Vite)**
   Handles UI, user input, and communication with the server.

2. **Nakama Server**
   Manages:

   * matchmaking
   * game state
   * real-time communication
   * authoritative game logic

3. **PostgreSQL Database (Render)**
   Stores leaderboard and user-related data.

Flow:
User → Frontend → Nakama (WebSocket/HTTP) → Database

---

## ⚙️ Tech Stack

* Frontend: React, TypeScript, Vite
* Backend: Nakama (Go-based game server)
* Database: PostgreSQL (Render managed DB)
* Deployment:

  * Frontend: Vercel
  * Backend: Render (Dockerized)

---

## 🔧 Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/Yashvendra09/tic-tac-toe-nakama
cd tic-tac-toe-nakama
```

---

### 2. Run Backend (Nakama)

```bash
cd tic-tac-toe-backend
docker-compose up
```

---

### 3. Run Frontend

```bash
cd tic-tac-toe-frontend
npm install
npm run dev
```

---

## 🌍 Environment Configuration

### Frontend (.env for local)

```
VITE_NAKAMA_HOST=127.0.0.1
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_SERVER_KEY=defaultkey
VITE_NAKAMA_USE_SSL=false
```

---

### Production Configuration

```
VITE_NAKAMA_HOST=tic-tac-toe-nakama-ekfg.onrender.com
VITE_NAKAMA_PORT=443
VITE_NAKAMA_USE_SSL=true
VITE_NAKAMA_SERVER_KEY=your_server_key
```

---

## 🚀 Deployment Process

### Backend (Nakama)

* Built using Docker
* Deployed on Render
* Connected to PostgreSQL database
* Environment variables used for database connection
* Handled SSL and port mapping issues for public access

### Frontend

* Built using Vite
* Deployed on Vercel
* Configured environment variables for production backend
* Ensured HTTPS + WSS compatibility

---

## ⚙️ Server / API Configuration

* Authentication: Device-based (`authenticateDevice`)
* Matchmaking: Nakama matchmaker (2 players)
* Communication: WebSocket (real-time)
* Game logic: Authoritative server-side match handler
* Leaderboard: `tictactoe_global_wins`

---

## 🧪 How to Test Multiplayer

1. Open the game in two browser tabs (or two devices)
2. Enter different usernames
3. Click "Continue" on both
4. Both users will automatically be matched
5. Play the game in real-time
6. Winner is recorded in leaderboard

**Note:**

* Backend may take ~30–60 seconds to wake up (Render free tier)
* If login fails first time, retry once

---

## ⚠️ Challenges Faced

* WebSocket SSL issues (ws vs wss)
* Render port restrictions (7350 not publicly accessible)
* Nakama database connection format mismatch
* Handling cold start delays
* Deployment caching issues on frontend

---

## 💡 Learnings

* Real-time systems require strict server authority
* Deployment issues can be as complex as development
* WebSockets with SSL require careful configuration
* Debugging distributed systems needs step-by-step isolation

---

## 👨‍💻 Author

Yashvendra Dagur
