import { io, Socket } from 'socket.io-client';

class TerminalService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionId = sessionId;
      this.socket = io('http://localhost:5000', {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        this.socket?.emit('terminal:connect', { sessionId });
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('terminal:error', (error) => {
        console.error('Terminal error:', error);
      });
    });
  }

  onData(callback: (data: string) => void): void {
    this.socket?.on('terminal:data', callback);
  }

  sendInput(data: string): void {
    this.socket?.emit('terminal:input', data);
  }

  resize(cols: number, rows: number): void {
    this.socket?.emit('terminal:resize', { cols, rows });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }
}

export default new TerminalService();