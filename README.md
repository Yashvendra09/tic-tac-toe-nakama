# 🎮 Real-Time Multiplayer Tic-Tac-Toe

A production-ready, real-time multiplayer Tic-Tac-Toe game built using **Nakama (game server)** and **React (frontend)**, supporting live matchmaking, WebSocket-based gameplay, and global leaderboards.

---

## 🚀 Live Demo

👉 https://tic-tac-toe-nakama-iz69vuoey-yashvendra09s-projects.vercel.app

---

## ✨ Features

* 🔐 Device-based authentication (no signup friction)
* ⚡ Real-time gameplay using WebSockets
* 🎯 Automatic matchmaking (2-player)
* ⏱️ Timed matches with turn-based logic
* 🏆 Global leaderboard (persistent via Postgres)
* 🔁 Reconnection handling & session recovery
* 🌐 Fully deployed (frontend + backend)

---

## 🧠 Architecture

Frontend (React + Vite)
⬇
Nakama Server (Authoritative game logic)
⬇
PostgreSQL (Render DB)

---

## ⚙️ Tech Stack

* Frontend: React, TypeScript, Vite
* Backend: Nakama (Go-based game server)
* Database: PostgreSQL (Render)
* Deployment:

  * Frontend → Vercel
  * Backend → Render (Dockerized)

---

## 🔥 Key Engineering Decisions

### 1. Authoritative Game Logic

Game state is handled on the server (Nakama match handler), preventing cheating and ensuring consistency across players.

### 2. WebSocket-based Communication

Used Nakama’s real-time socket instead of polling → low latency gameplay.

### 3. Device Authentication Strategy

Avoided traditional auth:

* Generates `deviceId`
* Handles conflicts (409)
* Recovers from stale sessions

### 4. Production Deployment Handling

* Resolved Render port binding issues
* Handled SSL/WSS constraints
* Configured environment variables securely
* Avoided hardcoded values

### 5. Fault Tolerance

* Retry logic for auth (cold start handling)
* Graceful error handling for network failures

---

## 🛠️ Local Setup

### 1. Clone repo

```bash
git clone https://github.com/Yashvendra09/tic-tac-toe-nakama
cd tic-tac-toe-nakama
```

### 2. Setup backend

```bash
cd tic-tac-toe-backend
docker-compose up
```

### 3. Setup frontend

```bash
cd tic-tac-toe-frontend
npm install
npm run dev
```

---

## 🌍 Environment Variables

### Frontend (.env)

```
VITE_NAKAMA_HOST=localhost
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_SERVER_KEY=defaultkey
VITE_NAKAMA_USE_SSL=false
```

### Production

```
VITE_NAKAMA_HOST=your-render-url
VITE_NAKAMA_PORT=443
VITE_NAKAMA_USE_SSL=true
```

---

## 📌 Challenges Faced

* WebSocket SSL issues (ws vs wss)
* Render port restrictions (7350 not exposed)
* Nakama DB connection format mismatch
* Cold start delays causing auth timeouts
* Deployment caching issues (Vercel)

---

## 💡 Learnings

* Real-time systems require strict backend authority
* Deployment infra matters as much as code
* WebSocket + SSL handling is tricky in production
* Debugging distributed systems is non-trivial

---

## 👨‍💻 Author

**Yashvendra Dagur**
