import { matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal } from './match_handler';

let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
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
    } catch (e) {
        logger.info("Leaderboards might already exist.", e);
    }

    // Register an RPC to start/find a match.
    // Instead of raw RPC, we can just let clients use the built-in Matchmaker.
    // The matchmaker matches players, and then the match needs to be created.
    // Nakama rule: The matchmaker creates a match automatically if a Matchmaker Matched hook is defined.
    initializer.registerMatchmakerMatched(matchmakerMatched);
};

// When matchmaker finds opponents, this hook creates the authoritative match
const matchmakerMatched: nkruntime.MatchmakerMatchedFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]) {
    logger.info("Matchmaker matched length: %d", matches.length);

    // Create the match
    const matchId = nk.matchCreate("tic-tac-toe", {
        mode: matches[0].properties.mode || "timed"
    });
    return matchId;
}

// Reference InitModule to avoid unused variable warning or TS complaining
// @ts-ignore
!InitModule && InitModule.bind(null);
