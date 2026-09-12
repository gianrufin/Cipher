export type RoomStatus = 'idle' | 'connecting' | 'connected' | 'error';

type RoomEventHandlers = {
  onStatus: (status: RoomStatus, message?: string) => void;
  onPeerOpen: (peerId: string) => void;
  onPeerClose: (peerId: string) => void;
  onData: (peerId: string, data: unknown) => void;
};

const rtcConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] };

export const makeRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
export const makePeerId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export class CipherPeerRoom {
  private socket?: WebSocket;
  private peers = new Map<string, RTCPeerConnection>();
  private channels = new Map<string, RTCDataChannel>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();

  constructor(private handlers: RoomEventHandlers) {}

  connect(baseUrl: string, roomCode: string, peerId: string, isHost: boolean) {
    this.handlers.onStatus('connecting');
    const root = baseUrl.replace(/\/$/, '').replace(/^http/, 'ws');
    this.socket = new WebSocket(`${root}/room/${encodeURIComponent(roomCode)}?peerId=${encodeURIComponent(peerId)}&host=${isHost ? '1' : '0'}`);
    this.socket.onopen = () => this.handlers.onStatus('connected');
    this.socket.onerror = () => this.handlers.onStatus('error', 'Could not reach the signaling service.');
    this.socket.onclose = () => this.handlers.onStatus('error', 'The room connection closed.');
    this.socket.onmessage = async event => {
      const message = JSON.parse(event.data);
      if (isHost && message.type === 'peer-joined') await this.createHostPeer(message.peerId);
      if (message.type === 'signal') await this.receiveSignal(message.from, message.payload, isHost);
      if (message.type === 'peer-left') this.removePeer(message.peerId);
    };
  }

  private createPeer(peerId: string) {
    const peer = new RTCPeerConnection(rtcConfig);
    peer.onicecandidate = event => {
      if (event.candidate) this.relay(peerId, { candidate: event.candidate });
    };
    peer.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(peer.connectionState)) this.removePeer(peerId);
    };
    this.peers.set(peerId, peer);
    return peer;
  }

  private wireChannel(peerId: string, channel: RTCDataChannel) {
    this.channels.set(peerId, channel);
    channel.onopen = () => this.handlers.onPeerOpen(peerId);
    channel.onmessage = event => {
      try { this.handlers.onData(peerId, JSON.parse(event.data)); } catch { this.handlers.onData(peerId, event.data); }
    };
    channel.onclose = () => this.removePeer(peerId);
  }

  private async createHostPeer(peerId: string) {
    const peer = this.createPeer(peerId);
    this.wireChannel(peerId, peer.createDataChannel('cipher'));
    await peer.setLocalDescription(await peer.createOffer());
    this.relay(peerId, { description: peer.localDescription });
  }

  private async receiveSignal(peerId: string, payload: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }, isHost: boolean) {
    let peer = this.peers.get(peerId);
    if (!peer) {
      peer = this.createPeer(peerId);
      peer.ondatachannel = event => this.wireChannel(peerId, event.channel);
    }
    if (payload.description) {
      await peer.setRemoteDescription(payload.description);
      for (const candidate of this.pendingCandidates.get(peerId) || []) await peer.addIceCandidate(candidate);
      this.pendingCandidates.delete(peerId);
      if (payload.description.type === 'offer' && !isHost) {
        await peer.setLocalDescription(await peer.createAnswer());
        this.relay(peerId, { description: peer.localDescription });
      }
    }
    if (payload.candidate) {
      if (peer.remoteDescription) await peer.addIceCandidate(payload.candidate);
      else this.pendingCandidates.set(peerId, [...(this.pendingCandidates.get(peerId) || []), payload.candidate]);
    }
  }

  private relay(target: string, payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ target, payload }));
  }

  send(peerId: string, data: unknown) {
    const channel = this.channels.get(peerId);
    if (channel?.readyState === 'open') channel.send(JSON.stringify(data));
  }

  broadcast(data: unknown) { this.channels.forEach((_, peerId) => this.send(peerId, data)); }

  close() {
    this.channels.forEach(channel => channel.close());
    this.peers.forEach(peer => peer.close());
    this.socket?.close();
    this.channels.clear(); this.peers.clear();
  }

  private removePeer(peerId: string) {
    this.channels.get(peerId)?.close(); this.peers.get(peerId)?.close();
    this.channels.delete(peerId); this.peers.delete(peerId); this.handlers.onPeerClose(peerId);
    this.pendingCandidates.delete(peerId);
  }
}
