import React, { useState, useEffect } from 'react';
import { gameClient } from './lib/nakama';

type ViewMode = 'login' | 'menu' | 'matchmaking' | 'game' | 'leaderboard';

interface GameState {
  board: string[];
  marks: { [userId: string]: string };
  turn: string;
  winner: string;
  deadline: number;
  mode: string;
  playerNames: { [mark: string]: string };
}

function App() {
  const [view, setView] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchStatus, setMatchStatus] = useState('');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myMark, setMyMark] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Synchronize state if joined but no payload received yet
  useEffect(() => {
    let poll: ReturnType<typeof setInterval>;
    if (view === 'game' && !gameState && gameClient.matchId && gameClient.socket) {
      gameClient.socket.sendMatchState(gameClient.matchId, 2, JSON.stringify({}));
      poll = setInterval(() => {
        gameClient.socket?.sendMatchState(gameClient.matchId!, 2, JSON.stringify({}));
      }, 1000);
    }
    return () => { if (poll) clearInterval(poll); };
  }, [view, gameState]);

  // Timer countdown hook
  useEffect(() => {
    if (view === 'game' && gameState && gameState.mode === 'timed' && gameState.deadline > 0 && gameState.winner === "") {
      const interval = setInterval(() => {
        const time = Math.max(0, Math.floor((gameState.deadline - Date.now()) / 1000));
        setTimeLeft(time);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameState, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      const session = await gameClient.authenticate(username);

      await gameClient.connectSocket(
        (matchData) => {
          console.log("Received a match payload from server:", matchData.op_code);
          if (matchData.op_code === 100) {
            const state = JSON.parse(new TextDecoder().decode(matchData.data));
            console.log("Parsed state:", state);
            setGameState(state);
            if (state.marks[session.user_id!]) {
              setMyMark(state.marks[session.user_id!]);
            }
          }
        },
        (presenceEvent) => {
          console.log("Presence event:", presenceEvent);
        }
      );

      // Add disconnect handler
      gameClient.socket!.ondisconnect = () => {
        setError("Connection lost. Please refresh the page.");
      };

      // Setup matchmaker matched listener
      gameClient.socket!.onmatchmakermatched = async (matched) => {
        setMatchStatus('Match found! Joining...');

        try {
          const match = await gameClient.socket!.joinMatch(matched.match_id, matched.token);
          gameClient.matchId = match.match_id;
          setView('game');
        } catch (e: any) {
          console.error("Join match failed", e);
          setError("Failed to join match: " + (e.message || "Unknown error"));
          setView('menu');
        }
      };

      setView('menu');
    } catch (err: any) {
      console.error("Auth error object:", err);
      if (err.message?.includes("Failed to fetch")) {
        setError("Cannot connect to server. Please try again later.");
      } else if (err.status === 409 || err.code === 6) {
        setError("Username already in use. Try a different name.");
      } else {
        setError("Unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatch = async (mode: string = "timed") => {
    setView('matchmaking');
    setMatchStatus(`Finding opponent (${mode} mode)...`);
    try {
      await gameClient.findMatch(mode);
    } catch (err: any) {
      setError("Matchmaker error: " + err.message);
      setView('menu');
    }
  };

  const handleOpenLeaderboard = async () => {
    setLoading(true);
    setView('leaderboard');
    const records = await gameClient.fetchLeaderboard();
    setLeaderboard(records);
    setLoading(false);
  };

  const handleCellClick = async (index: number) => {
    if (!gameState) return;
    if (gameState.winner !== "") return;
    if (gameState.turn !== myMark) return;
    if (gameState.board[index] !== "") return;

    // Optimistically update
    const newBoard = [...gameState.board];
    newBoard[index] = myMark;
    setGameState({ ...gameState, board: newBoard });

    // Send to server
    await gameClient.sendMove(index);
  };

  const renderCell = (mark: string, index: number) => {
    const isMyTurn = gameState?.turn === myMark && gameState?.winner === "" && mark === "";
    return (
      <div
        key={index}
        className={`cell ${!isMyTurn ? 'disabled' : ''} ${mark === 'X' ? 'mark-x' : mark === 'O' ? 'mark-o' : ''}`}
        onClick={() => handleCellClick(index)}
      >
        {mark && <span className="anim-pop">{mark}</span>}
      </div>
    );
  };

  return (
    <div className="anim-pop">
      {/* --- LOGIN VIEW --- */}
      {view === 'login' && (
        <div className="card">
          <h1 className="title">Tic-Tac-Toe</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              className="input"
              placeholder="Enter your nickname..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {error && <p style={{ color: 'var(--o-color)', marginBottom: '1rem' }}>{error}</p>}
            <button className="btn" type="submit" disabled={loading || !username.trim()}>
              {loading ? 'Connecting...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {/* --- MENU VIEW --- */}
      {view === 'menu' && (
        <div className="card text-center">
          <h1 className="title">Welcome, {username}</h1>
          {error && <p style={{ color: 'var(--o-color)', marginBottom: '1rem' }}>{error}</p>}
          <button className="btn" style={{ marginBottom: '1rem' }} onClick={() => handleFindMatch('timed')}>
            Play Timed Match (30s turns)
          </button>
          <button className="btn" style={{ marginBottom: '1rem', background: '#3b82f6' }} onClick={() => handleFindMatch('classic')}>
            Play Classic Match (No timer)
          </button>
          <button className="btn" style={{ background: 'var(--surface-color)', border: '1px solid var(--primary-color)' }} onClick={handleOpenLeaderboard}>
            View Leaderboard
          </button>
        </div>
      )}

      {/* --- MATCHMAKING VIEW --- */}
      {view === 'matchmaking' && (
        <div className="card text-center">
          <h2 className="title" style={{ fontSize: '1.8rem' }}>{matchStatus}</h2>
          <div className="timer" style={{ margin: '2rem 0' }}>
            Please wait...
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Waiting for another player...</p>
          </div>
          <button className="btn" style={{ background: 'var(--surface-color)' }} onClick={async () => {
            // @ts-ignore - ticket argument skipped per instruction
            await gameClient.socket?.leaveMatchmaker();
            setMatchStatus("Match cancelled");
            setError("");
            setView("menu");
          }}>
            Cancel
          </button>
        </div>
      )}

      {/* --- GAME LOADING VIEW --- */}
      {view === 'game' && !gameState && (
        <div className="card text-center">
          <h2 className="title" style={{ fontSize: '1.8rem' }}>Initializing Match</h2>
          <div className="timer" style={{ margin: '2rem 0', color: 'var(--primary-color)' }}>
            Synchronizing state with server...
          </div>
        </div>
      )}

      {/* --- GAME VIEW --- */}
      {view === 'game' && gameState && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          
          {/* Header Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="text-center" style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{username}</div>
                <div className={`mark-${myMark.toLowerCase()}`} style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1 }}>{myMark}</div>
              </div>
              
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                VS
              </div>

              <div className="text-center" style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  {gameState.playerNames[myMark === 'X' ? 'O' : 'X'] || 'Waiting...'}
                </div>
                <div className={`mark-${myMark === 'X' ? 'o' : 'x'}`} style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1 }}>
                  {myMark === 'X' ? 'O' : 'X'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.1rem', background: 'rgba(0,0,0,0.4)', padding: '0.5rem 1.5rem', borderRadius: '20px', display: 'inline-block' }}>
               {gameState.winner === "" ? (
                 <>
                   {gameState.mode === 'timed' && Object.keys(gameState.marks).length === 2 && <span style={{color: '#fbbf24', marginRight: '10px'}}>⏱️ {timeLeft}s</span>}
                   {Object.keys(gameState.marks).length < 2 ? (
                      <span style={{ color: 'var(--text-secondary)'}}>Waiting for opponent to join...</span>
                   ) : gameState.turn === myMark ? 
                      <span style={{ color: 'var(--primary-color)', fontWeight: 'bold'}}>It's your turn!</span> : 
                      <span style={{ color: 'var(--text-secondary)'}}>Waiting for opponent...</span>
                   }
                 </>
               ) : (
                 <span style={{fontWeight: 'bold', color: gameState.winner === myMark ? 'var(--x-color)' : gameState.winner === 'DRAW' ? 'white' : 'var(--o-color)'}}>
                   {gameState.winner === 'DRAW' ? 'MATCH DRAWN!' : gameState.winner === myMark ? 'YOU WON!' : 'YOU LOST!'}
                 </span>
               )}
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            <div className="board" style={{ margin: '0 auto' }}>
              {gameState.board.map((cell, idx) => renderCell(cell, idx))}
            </div>

            {gameState.winner !== "" && (
               <div className="anim-pop text-center" style={{ marginTop: '2rem' }}>
                 <button className="btn" onClick={() => {
                   setView('menu');
                   gameClient.matchId = null;
                   setGameState(null);
                 }}>Leave Match</button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* --- LEADERBOARD VIEW --- */}
      {view === 'leaderboard' && (
        <div className="card">
          <h2 className="title" style={{ fontSize: '2rem' }}>Global Rankings</h2>
          {loading ? <p className="text-center">Loading...</p> : (
            <div className="leaderboard">
              <div className="leaderboard-item" style={{ fontWeight: 'bold', background: 'transparent' }}>
                <span>Player</span>
                <span>Wins</span>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-center" style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>No records yet.</p>
              ) : (
                leaderboard.map((rec, i) => (
                  <div key={rec.owner_id} className="leaderboard-item">
                    <span>{i + 1}. {rec.username}</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{rec.score}</span>
                  </div>
                ))
              )}
            </div>
          )}
          <button className="btn" style={{ marginTop: '2rem' }} onClick={() => setView('menu')}>Back to Menu</button>
        </div>
      )}

    </div>
  );
}

export default App;
