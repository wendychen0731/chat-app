import { useCallback, useState } from "react";

/**
 * 通用未讀 hook，若你選擇把 unread 用 global store，可不需要此檔。
 */
export default function useUnread() {
  const [unread, setUnread] = useState({ "": 0 });

  const incUnread = useCallback((roomKey) => {
    setUnread((u) => ({ ...u, [roomKey]: (u[roomKey] || 0) + 1 }));
  }, []);

  const clearUnread = useCallback((roomKey) => {
    setUnread((u) => ({ ...u, [roomKey]: 0 }));
  }, []);

  return { unread, incUnread, clearUnread };
}
