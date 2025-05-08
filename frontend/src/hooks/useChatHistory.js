import { useCallback } from "react";

/**
 * useChatHistory — 只負責 fetch 歷史與捲到底；真正訊息狀態交由父層
 */
export default function useChatHistory(username) {
  const fetchHistory = useCallback((roomKey) => {
    const base = import.meta.env.VITE_HTTP_HISTORY_URL;
    const url = roomKey === "" ? base : `${base}?user=${username}&peer=${roomKey}`;
    return fetch(url).then((r) => r.json());
  }, [username]);

  return { fetchHistory };
}
