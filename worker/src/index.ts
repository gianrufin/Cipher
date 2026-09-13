export interface Env { ROOMS: DurableObjectNamespace; }

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (url.pathname === '/health') return cors(Response.json({ ok: true, service: 'cipher-signaling' }));
    const crewMatch = url.pathname.match(/^\/crew\/([A-Z0-9]{4,8})\/(history|reserve|profile)$/i);
    if (crewMatch) {
      const crew = env.ROOMS.get(env.ROOMS.idFromName(`crew:${crewMatch[1].toUpperCase()}`));
      return cors(await crew.fetch(request));
    }
    const match = url.pathname.match(/^\/room\/([A-Z0-9]{4,8})$/i);
    if (!match) return new Response('Cipher signaling service', { status: 200 });
    const room = env.ROOMS.get(env.ROOMS.idFromName(match[1].toUpperCase()));
    return room.fetch(request);
  }
};

const cors = (response: Response) => {
  const next = new Response(response.body, response);
  next.headers.set('access-control-allow-origin', '*');
  next.headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  next.headers.set('access-control-allow-headers', 'content-type');
  return next;
};

export class CipherRoom {
  private clients = new Map<WebSocket, { peerId: string; host: boolean }>();

  constructor(private state: DurableObjectState) {
    state.getWebSockets().forEach(socket => {
      const attachment = socket.deserializeAttachment() as { peerId: string; host: boolean } | null;
      if (attachment) this.clients.set(socket, attachment);
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/profile')) {
      if (request.method === 'GET') {
        const profile = await this.state.storage.get('crew-profile');
        return profile ? Response.json(profile) : new Response('Crew not found', { status: 404 });
      }
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      const profile = await request.json();
      await this.state.storage.put('crew-profile', profile);
      return Response.json(profile);
    }
    if (url.pathname.endsWith('/history') || url.pathname.endsWith('/reserve')) {
      const stored = await this.state.storage.get<{ pairKeys: string[]; wordKeys: string[] }>('word-history')
        || { pairKeys: [], wordKeys: [] };
      if (request.method === 'GET') return Response.json(stored);
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      const incoming = await request.json() as {
        pairKeys?: string[];
        wordKeys?: string[];
        candidates?: Array<{ id: string; wordIds: string[] }>;
      };
      if (url.pathname.endsWith('/reserve')) {
        const reservation = await this.state.storage.transaction(async transaction => {
          const latest = await transaction.get<{ pairKeys: string[]; wordKeys: string[] }>('word-history')
            || { pairKeys: [], wordKeys: [] };
          const chosen = (incoming.candidates || []).find(candidate => !latest.pairKeys.includes(candidate.id));
          if (!chosen) return { exhausted: true as const, history: latest };
          const history = {
            pairKeys: [...new Set([...latest.pairKeys, chosen.id])].slice(-2000),
            wordKeys: [...new Set([...latest.wordKeys, ...chosen.wordIds])].slice(-160)
          };
          await transaction.put('word-history', history);
          return { exhausted: false as const, id: chosen.id, history };
        });
        if (reservation.exhausted) return Response.json({ ...reservation.history, exhausted: true }, { status: 409 });
        return Response.json({ id: reservation.id, ...reservation.history });
      }
      const history = {
        pairKeys: [...new Set([...stored.pairKeys, ...(incoming.pairKeys || [])])].slice(-2000),
        wordKeys: [...new Set([...stored.wordKeys, ...(incoming.wordKeys || [])])].slice(-160)
      };
      await this.state.storage.put('word-history', history);
      return Response.json(history);
    }
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket required', { status: 426 });
    const peerId = url.searchParams.get('peerId');
    const host = url.searchParams.get('host') === '1';
    if (!peerId) return new Response('peerId required', { status: 400 });
    const pair = new WebSocketPair();
    const client = pair[0]; const server = pair[1];
    this.state.acceptWebSocket(server);
    const identity = { peerId, host };
    server.serializeAttachment(identity);
    this.clients.set(server, identity);
    if (!host) this.sendToHost({ type: 'peer-joined', peerId });
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string') return;
    const sender = this.clients.get(socket);
    if (!sender) return;
    try {
      const message = JSON.parse(raw) as { target: string; payload: unknown };
      this.sendToPeer(message.target, { type: 'signal', from: sender.peerId, payload: message.payload });
    } catch { /* ignore malformed signaling packets */ }
  }

  webSocketClose(socket: WebSocket) { this.disconnect(socket); }
  webSocketError(socket: WebSocket) { this.disconnect(socket); }

  private disconnect(socket: WebSocket) {
    const identity = this.clients.get(socket);
    this.clients.delete(socket);
    if (identity) this.clients.forEach((_clientIdentity, client) => client.send(JSON.stringify({ type: 'peer-left', peerId: identity.peerId })));
  }

  private sendToPeer(peerId: string, data: unknown) {
    this.clients.forEach((identity, socket) => { if (identity.peerId === peerId) socket.send(JSON.stringify(data)); });
  }

  private sendToHost(data: unknown) {
    this.clients.forEach((identity, socket) => { if (identity.host) socket.send(JSON.stringify(data)); });
  }
}
