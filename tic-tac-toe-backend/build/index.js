var NEXT_TURN_TIME_MS = 30000; // 30 seconds per turn
var matchInit = function (ctx, logger, nk, params) {
    logger.info("matchInit called");
    var mode = params.mode || "timed";
    var state = {
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
        state: state,
        tickRate: 2, // 2 ticks per second is enough for tic-tac-toe
        label: "tic-tac-toe"
    };
};
var matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    var gameState = state;
    if (gameState.presences.length >= 2) {
        return {
            state: gameState,
            accept: false,
            rejectMessage: "Match is already full"
        };
    }
    // Attempting to rejoin? Allow if they are already in the match logic optionally.
    return {
        state: gameState,
        accept: true
    };
};
var matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    var gameState = state;
    var _loop_1 = function (p) {
        if (!gameState.presences.some(function (x) { return x.userId === p.userId; })) {
            gameState.presences.push(p);
            // Assign mark
            if (Object.keys(gameState.marks).length === 0) {
                gameState.marks[p.userId] = "X";
                gameState.playerNames["X"] = p.username;
            }
            else if (Object.keys(gameState.marks).length === 1) {
                gameState.marks[p.userId] = "O";
                gameState.playerNames["O"] = p.username;
                // Both joined, start deadline if timed mode
                if (gameState.mode === "timed") {
                    gameState.deadline = Date.now() + NEXT_TURN_TIME_MS;
                }
            }
        }
    };
    for (var _i = 0, presences_1 = presences; _i < presences_1.length; _i++) {
        var p = presences_1[_i];
        _loop_1(p);
    }
    broadcastState(dispatcher, gameState);
    return { state: gameState };
};
var matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    var gameState = state;
    logger.info("matchLeave called");
    var _loop_2 = function (p) {
        gameState.presences = gameState.presences.filter(function (x) { return x.userId !== p.userId; });
        // If match is not over, the leaver forfeits
        if (gameState.winner === "") {
            var mark = gameState.marks[p.userId];
            if (mark) {
                gameState.winner = mark === "X" ? "O" : "X";
                recordWin(nk, logger, gameState);
            }
            else {
                gameState.winner = "DRAW"; // Left before marks assigned?
            }
            gameState.deadline = 0;
            broadcastState(dispatcher, gameState);
        }
    };
    for (var _i = 0, presences_2 = presences; _i < presences_2.length; _i++) {
        var p = presences_2[_i];
        _loop_2(p);
    }
    return { state: gameState };
};
var matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    var gameState = state;
    // Check timers
    if (gameState.mode === "timed" && gameState.winner === "" && gameState.presences.length === 2 && gameState.deadline > 0) {
        if (Date.now() > gameState.deadline) {
            // Current turn player forfeited
            gameState.winner = gameState.turn === "X" ? "O" : "X";
            logger.info("Timeout! Winner is %s", gameState.winner);
            recordWin(nk, logger, gameState);
            gameState.deadline = 0;
            broadcastState(dispatcher, gameState);
            return { state: gameState };
        }
    }
    // Process messages
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var msg = messages_1[_i];
        if (msg.opCode === 2) {
            // Client requesting a state sync (resolves initial race conditions smoothly)
            broadcastState(dispatcher, gameState);
        }
        else if (msg.opCode === 1 && gameState.winner === "") {
            // OpCode 1: Make a move
            var mark = gameState.marks[msg.sender.userId];
            if (mark !== gameState.turn) {
                continue; // Not their turn
            }
            var data = void 0;
            try {
                data = JSON.parse(nk.binaryToString(msg.data));
            }
            catch (e) {
                continue;
            }
            var position = typeof data.position === 'number' ? data.position : -1;
            if (position >= 0 && position < 9 && gameState.board[position] === "") {
                // Valid move
                gameState.board[position] = mark;
                // Check win condition
                var winLines = [
                    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
                    [0, 4, 8], [2, 4, 6] // Diagonals
                ];
                var isWin = false;
                for (var _a = 0, winLines_1 = winLines; _a < winLines_1.length; _a++) {
                    var line = winLines_1[_a];
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
                }
                else if (gameState.board.indexOf("") === -1) {
                    gameState.winner = "DRAW";
                    gameState.deadline = 0;
                }
                else {
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
        }
        else if (Date.now() > gameState.deadline) {
            return null; // returning null terminates the match
        }
    }
    return { state: gameState };
};
var matchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    logger.info("matchTerminate called");
    return { state: state };
};
var matchSignal = function (ctx, logger, nk, dispatcher, tick, state, data) {
    return { state: state };
};
function broadcastState(dispatcher, state) {
    // OpCode 100: State Update
    var payload = JSON.stringify({
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
function recordWin(nk, logger, state) {
    if (state.winner === "" || state.winner === "DRAW") {
        return;
    }
    // Find winner and loser userId
    var winnerId = "";
    var loserId = "";
    for (var userId in state.marks) {
        if (Object.prototype.hasOwnProperty.call(state.marks, userId)) {
            var mark = state.marks[userId];
            if (mark === state.winner) {
                winnerId = userId;
            }
            else {
                loserId = userId;
            }
        }
    }
    // Process winner
    if (winnerId) {
        var winnerUsername = state.playerNames[state.winner] || "Unknown";
        try {
            logger.info("Writing WIN to leaderboard for: %s (%s)", winnerUsername, winnerId);
            nk.leaderboardRecordWrite("tictactoe_global_wins", winnerId, winnerUsername, 1);
        }
        catch (e) {
            logger.error("Failed to write winner to leaderboard: %s", e.message);
        }
    }
    // Process loser
    if (loserId) {
        var loserMark = state.winner === "X" ? "O" : "X";
        var loserUsername = state.playerNames[loserMark] || "Unknown";
        try {
            logger.info("Writing LOSS to leaderboard for: %s (%s)", loserUsername, loserId);
            nk.leaderboardRecordWrite("tictactoe_global_losses", loserId, loserUsername, 1);
        }
        catch (e) {
            logger.error("Failed to write loser to leaderboard: %s", e.message);
        }
    }
}

var InitModule = function (ctx, logger, nk, initializer) {
    logger.info("Initializing Tic-Tac-Toe module v1.0");
    // Register match handlers
    initializer.registerMatch("tic-tac-toe", {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    try {
        nk.leaderboardCreate("tictactoe_global_wins", true, "desc", "incr", "", null);
        nk.leaderboardCreate("tictactoe_global_losses", true, "desc", "incr", "", null);
        logger.info("Leaderboard tictactoe_global_wins and losses created.");
    }
    catch (e) {
        logger.info("Leaderboards might already exist.", e);
    }
    // Register an RPC to start/find a match.
    // Instead of raw RPC, we can just let clients use the built-in Matchmaker.
    // The matchmaker matches players, and then the match needs to be created.
    // Nakama rule: The matchmaker creates a match automatically if a Matchmaker Matched hook is defined.
    initializer.registerMatchmakerMatched(matchmakerMatched);
};
// When matchmaker finds opponents, this hook creates the authoritative match
var matchmakerMatched = function (ctx, logger, nk, matches) {
    logger.info("Matchmaker matched length: %d", matches.length);
    // Create the match
    var matchId = nk.matchCreate("tic-tac-toe", {
        mode: matches[0].properties.mode || "timed"
    });
    return matchId;
};
// Reference InitModule to avoid unused variable warning or TS complaining
// @ts-ignore
!InitModule && InitModule.bind(null);
