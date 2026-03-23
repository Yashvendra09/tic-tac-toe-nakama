declare namespace nkruntime {
  export type Context = any;
  export type Logger = any;
  export type Nakama = any;
  export type MatchState = any;
  export type MatchDispatcher = any;
  export type Presence = any;
  export type MatchMessage = any;
  export type MatchmakerResult = any;
  export type Initializer = any;
  
  export type InitModule = (ctx: Context, logger: Logger, nk: Nakama, initializer: Initializer) => void;
  export type MatchInitFunction = (ctx: Context, logger: Logger, nk: Nakama, params: {[key: string]: string}) => {state: MatchState, tickRate: number, label: string};
  export type MatchJoinAttemptFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: MatchState, presence: Presence, metadata: {[key: string]: any }) => {state: MatchState, accept: boolean, rejectMessage?: string } | null;
  export type MatchJoinFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: MatchState, presences: Presence[]) => {state: MatchState} | null;
  export type MatchLeaveFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: MatchState, presences: Presence[]) => {state: MatchState} | null;
  export type MatchLoopFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: MatchState, messages: MatchMessage[]) => {state: MatchState} | null;
  export type MatchTerminateFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: MatchState, graceSeconds: number) => {state: MatchState} | null;
  export type MatchSignalFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: MatchState, data: string) => {state: MatchState, data?: string} | null;
  export type MatchmakerMatchedFunction = (ctx: Context, logger: Logger, nk: Nakama, matches: MatchmakerResult[]) => string | null;
}
