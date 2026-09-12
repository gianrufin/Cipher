export interface Env { ROOMS: DurableObjectNamespace; }

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ ok: true, service: 'cipher-signaling' });
    const match = url.pathname.match(/^\/room\/([A-Z0-9]{4,8})$/i);
    if (!match) return new Response('Cipher signaling service', { status: 200 });
    const room = env.ROOMS.get(env.ROOMS.idFromName(match[1].toUpperCase()));
    return room.fetch(request);
  }
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
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket required', { status: 426 });
    const url = new URL(request.url);
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
    if (identity) this.clients.forEach(client => client.send(JSON.stringify({ type: 'peer-left', peerId: identity.peerId })));
  }

  private sendToPeer(peerId: string, data: unknown) {
    this.clients.forEach((identity, socket) => { if (identity.peerId === peerId) socket.send(JSON.stringify(data)); });
  }

  private sendToHost(data: unknown) {
    this.clients.forEach((identity, socket) => { if (identity.host) socket.send(JSON.stringify(data)); });
  }
}
