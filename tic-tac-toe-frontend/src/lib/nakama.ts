import { Client } from '@heroiclabs/nakama-js';
import type { Session, Socket, MatchData } from '@heroiclabs/nakama-js';

// The singleton instance
export class GameClient {
  private client: Client;
  public session: Session | null = null;
  public socket: Socket | null = null;
  public matchId: string | null = null;

  constructor() {
    this.client = new Client(
      import.meta.env.VITE_NAKAMA_SERVER_KEY,
      import.meta.env.VITE_NAKAMA_HOST,
      undefined,
      true
    );
  }

  async authenticate(username: string): Promise<Session> {
    let deviceId = sessionStorage.getItem("deviceId");

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      sessionStorage.setItem("deviceId", deviceId);
    }

    try {
      // Try create or login - if username taken by same deviceId just logs in, if taken by diff device → 409
      this.session = await this.client.authenticateDevice(deviceId, true, username);
    } catch (err: any) {
      if (err.status === 409 || err.code === 6) {
        // Username taken by this same device → login without username change
        this.session = await this.client.authenticateDevice(deviceId, false);
      } else if (err.status === 401 || err.status === 404 || err.code === 5 || err.code === 16) {
        // DB was reset - deviceId is stale. Generate a fresh one and retry.
        console.warn('Stale deviceId detected (server DB may have been reset). Re-generating...');
        deviceId = crypto.randomUUID();
        sessionStorage.setItem('deviceId', deviceId);
        this.session = await this.client.authenticateDevice(deviceId, true, username);
      } else {
        throw err;
      }
    }

    return this.session;
  }

  async connectSocket(onMatchData: (data: MatchData) => void, onMatchPresence: (presence: any) => void): Promise<Socket> {
    if (!this.session) throw new Error("Not authenticated");

    this.socket = this.client.createSocket(true, false);
    this.socket.onmatchdata = onMatchData;
    this.socket.onmatchpresence = onMatchPresence;

    await this.socket.connect(this.session, true);
    return this.socket;
  }

  async findMatch(mode: string = "timed"): Promise<string> {
    if (!this.socket) throw new Error("Socket not connected");

    // We expect the server matchmakerMatched hook to automatically create a match and return its auth token!
    // Wait, the hook `matchmakerMatched` in Nakama uses `return matchId` to create the authoritative match.
    // The server will then send a matchmaker matched event to the clients.
    const ticket = await this.socket.addMatchmaker("*", 2, 2, { mode: mode });

    return ticket.ticket || "";
  }

  async sendMove(position: number) {
    if (!this.socket || !this.matchId) return;

    // OpCode 1 for Move
    await this.socket.sendMatchState(this.matchId, 1, JSON.stringify({ position }));
  }

  async fetchLeaderboard() {
    if (!this.session) {
      console.error('fetchLeaderboard: no session!');
      return [];
    }
    try {
      console.log('Fetching leaderboard with session token:', this.session.token?.slice(0, 20) + '...');
      // Correct signature: (session, leaderboardId, ownerIds?, limit?, cursor?, expiry?)
      const records = await this.client.listLeaderboardRecords(
        this.session,
        'tictactoe_global_wins',
        undefined, // ownerIds
        100,       // limit
      );
      console.log('Leaderboard raw response:', records);
      return records.records || [];
    } catch (e) {
      console.error('Leaderboard fetch failed:', e);
      return [];
    }
  }
}

export const gameClient = new GameClient();
