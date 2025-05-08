/**
 * useChatHistory.js
 *
 * 提供一個自訂 Hook，用於拉取指定房間的歷史聊天記錄。
 * Hook 本身僅負責發送 fetch 請求與回傳資料，狀態管理需由上層元件自行處理。
 *
 * @param {string} username - 當前使用者名稱，用於組合私聊房間的查詢參數
 * @returns {{ fetchHistory: function(string): Promise<any[]> }}
 *   fetchHistory(roomKey) - 傳入房間 key (空字串代表公聊)，回傳 Promise，解析後為歷史訊息陣列。
 */
import { useCallback } from "react";

export default function useChatHistory(username) {
  /**
   * fetchHistory
   * @param {string} roomKey - 房間識別符，空字串代表公聊，非空代表私聊對象的 username
   * @returns {Promise<any[]>} - 取得該房間的聊天歷史，JSON 解析後的陣列
   */
  const fetchHistory = useCallback(
    (roomKey) => {
      const base = import.meta.env.VITE_HTTP_HISTORY_URL;
      const url =
        roomKey === ""
          ? base
          : `${base}?user=${username}&peer=${roomKey}`; // 私聊使用者與 peer 查詢參數
      return fetch(url).then((r) => r.json());
    },
    [username]
  );

  return { fetchHistory };
}
