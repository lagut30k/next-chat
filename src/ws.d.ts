declare global {
  namespace WebSocket {
    export interface WebSocket {
      isAuthenticated: boolean;
    }
  }
}
