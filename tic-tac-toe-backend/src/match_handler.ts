// match_handler.ts
export interface GameState {
    board: string[]; // 9 elements: "" | "X" | "O"
    marks: { [userId: string]: string }; // Map user ID to mark ("X" or "O")
    presences: nkruntime.Presence[]; // Connected players
    turn: string; // "X" | "O"
    winner: string; // "" | "X" | "O" | "DRAW"
    deadline: number; // Unix timestamp for turn forfeit (ms)
    mode: string; // "timed" | "classic"
    playerNames: { [mark: string]: string }; // Map "X" -> username, "O" -> username
}

const NEXT_TURN_TIME_MS = 30000; // 30 seconds per turn

export const matchInit: nkruntime.MatchInitFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: string }): { state: nkruntime.MatchState, tickRate: number, label: string } {
    logger.info("matchInit called");

    const mode = params.mode || "timed";
    const state: GameState = {
        board: ["", "", "", "", "", "", "", "", ""],
        marks: {},
        presences: [],
        turn: "X",
        winner: "",
        deadline: 0,
        mode: mode,
        playerNames: {}
    };

    return {
        state: state as any,
        tickRate: 2, // 2 ticks per second is enough for tic-tac-toe
        label: "tic-tac-toe"
    };
};

export const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: { [key: string]: any }): { state: nkruntime.MatchState, accept: boolean, rejectMessage?: string | undefined } | null {
    const gameState = state as GameState;

    if (gameState.presences.length >= 2) {
        return {
            state: gameState as any,
            accept: false,
            rejectMessage: "Match is already full"
        };
    }

    // Attempting to rejoin? Allow if they are already in the match logic optionally.
    return {
        state: gameState as any,
        accept: true
    };
};

export const matchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): { state: nkruntime.MatchState } | null {
    const gameState = state as GameState;

    for (const p of presences) {
        if (!gameState.presences.some(function (x) { return x.userId === p.userId; })) {
            gameState.presences.push(p);

            // Assign mark
            if (Object.keys(gameState.marks).length === 0) {
                gameState.marks[p.userId] = "X";
                gameState.playerNames["X"] = p.username;
            } else if (Object.keys(gameState.marks).length === 1) {
                gameState.marks[p.userId] = "O";
                gameState.playerNames["O"] = p.username;
                // Both joined, start deadline if timed mode
                if (gameState.mode === "timed") {
                    gameState.deadline = Date.now() + NEXT_TURN_TIME_MS;
                }
            }
        }
    }

    broadcastState(dispatcher, gameState);
    return { state: gameState as any };
};

export const matchLeave: nkruntime.MatchLeaveFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): { state: nkruntime.MatchState } | null {
    const gameState = state as GameState;
    logger.info("matchLeave called");

    for (const p of presences) {
        gameState.presences = gameState.presences.filter(x => x.userId !== p.userId);

        // If match is not over, the leaver forfeits
        if (gameState.winner === "") {
            const mark = gameState.marks[p.userId];
            if (mark) {
                gameState.winner = mark === "X" ? "O" : "X";
                recordWin(nk, logger, gameState);
            } else {
                gameState.winner = "DRAW"; // Left before marks assigned?
            }
            gameState.deadline = 0;
            broadcastState(dispatcher, gameState);
        }
    }

    return { state: gameState as any };
};

export const matchLoop: nkruntime.MatchLoopFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): { state: nkruntime.MatchState } | null {
    const gameState = state as GameState;

    // Check timers
    if (gameState.mode === "timed" && gameState.winner === "" && gameState.presences.length === 2 && gameState.deadline > 0) {
        if (Date.now() > gameState.deadline) {
            // Current turn player forfeited
            gameState.winner = gameState.turn === "X" ? "O" : "X";
            logger.info("Timeout! Winner is %s", gameState.winner);
            recordWin(nk, logger, gameState);
            gameState.deadline = 0;
            broadcastState(dispatcher, gameState);
            return { state: gameState as any };
        }
    }

    // Process messages
    for (const msg of messages) {
        if (msg.opCode === 2) {
            // Client requesting a state sync (resolves initial race conditions smoothly)
            broadcastState(dispatcher, gameState);
        }
        else if (msg.opCode === 1 && gameState.winner === "") {
            // OpCode 1: Make a move
            const mark = gameState.marks[msg.sender.userId];
            if (mark !== gameState.turn) {
                continue; // Not their turn
            }

            let data: any;
            try {
                data = JSON.parse(nk.binaryToString(msg.data));
            } catch (e) {
                continue;
            }
            const position = typeof data.position === 'number' ? data.position : -1;

            if (position >= 0 && position < 9 && gameState.board[position] === "") {
                // Valid move
                gameState.board[position] = mark;

                // Check win condition
                const winLines = [
                    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
                    [0, 4, 8], [2, 4, 6]             // Diagonals
                ];

                let isWin = false;
                for (const line of winLines) {
                    if (gameState.board[line[0]] !== "" &&
                        gameState.board[line[0]] === gameState.board[line[1]] &&
                        gameState.board[line[1]] === gameState.board[line[2]]) {
                        isWin = true;
                        break;
                    }
                }

                if (isWin) {
                    gameState.winner = mark;
                    gameState.deadline = 0;
                    recordWin(nk, logger, gameState);
                } else if (gameState.board.indexOf("") === -1) {
                    gameState.winner = "DRAW";
                    gameState.deadline = 0;
                } else {
                    // Next turn
                    gameState.turn = mark === "X" ? "O" : "X";
                    if (gameState.mode === "timed") {
                        gameState.deadline = Date.now() + NEXT_TURN_TIME_MS;
                    }
                }

                broadcastState(dispatcher, gameState);
            }
        }
    }

    // If game is over, we close the match down after 5 seconds to let players see results
    if (gameState.winner !== "") {
        if (gameState.deadline === 0) {
            gameState.deadline = Date.now() + 5000;
        } else if (Date.now() > gameState.deadline) {
            return null; // returning null terminates the match
        }
    }

    return { state: gameState as any };
};

export const matchTerminate: nkruntime.MatchTerminateFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): { state: nkruntime.MatchState } | null {
    logger.info("matchTerminate called");
    return { state: state };
};

export const matchSignal: nkruntime.MatchSignalFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string): { state: nkruntime.MatchState, data?: string } | null {
    return { state: state };
}

function broadcastState(dispatcher: nkruntime.MatchDispatcher, state: GameState) {
    // OpCode 100: State Update
    const payload = JSON.stringify({
        board: state.board,
        marks: state.marks,
        turn: state.turn,
        winner: state.winner,
        deadline: state.deadline,
        mode: state.mode,
        playerNames: state.playerNames
    });
    // Explicitly passing state.presences prevents Goja from casting null to an empty array
    // which was silently dropping all broadcasts!
    dispatcher.broadcastMessage(100, payload, state.presences, null, true);
}

function recordWin(nk: nkruntime.Nakama, logger: nkruntime.Logger, state: GameState) {
    if (state.winner === "" || state.winner === "DRAW") {
        return;
    }

    // Find winner and loser userId
    let winnerId = "";
    let loserId = "";
    for (const userId in state.marks) {
        if (Object.prototype.hasOwnProperty.call(state.marks, userId)) {
            const mark = state.marks[userId];
            if (mark === state.winner) {
                winnerId = userId;
            } else {
                loserId = userId;
            }
        }
    }

    // Process winner
    if (winnerId) {
        const winnerUsername = state.playerNames[state.winner] || "Unknown";
        try {
            logger.info("Writing WIN to leaderboard for: %s (%s)", winnerUsername, winnerId);
            nk.leaderboardRecordWrite("tictactoe_global_wins", winnerId, winnerUsername, 1);
        } catch (e: any) {
            logger.error("Failed to write winner to leaderboard: %s", e.message);
        }
    }

    // Process loser
    if (loserId) {
        const loserMark = state.winner === "X" ? "O" : "X";
        const loserUsername = state.playerNames[loserMark] || "Unknown";
        try {
            logger.info("Writing LOSS to leaderboard for: %s (%s)", loserUsername, loserId);
            nk.leaderboardRecordWrite("tictactoe_global_losses", loserId, loserUsername, 1);
        } catch (e: any) {
            logger.error("Failed to write loser to leaderboard: %s", e.message);
        }
    }
}
