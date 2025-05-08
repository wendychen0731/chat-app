/**
 * utils/ws.js
 * 專職處理 WebSocket 連線與 JSON 打包
 */

export function initWs() {
    return new WebSocket(import.meta.env.VITE_WS_URL);
  }
  
  export function buildPkt(type, payload = {}) {
    return JSON.stringify({ type, ...payload });
  }
  