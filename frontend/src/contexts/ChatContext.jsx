import React, { createContext, useMemo, useState, useRef } from "react";

/**
 * ChatContext 會保存：
 *   - username：使用者暱稱（localStorage 自取）
 *   - room / setRoom：當前房間（'' = 公聊）
 *   - roomRef：同步版 room 的 ref（供 WebSocket callback 使用）
 *   - unread / incUnread / clearUnread：未讀邏輯
 */
export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  /* username — 一次性從 localStorage 讀取 / 產生 */
  const username = useMemo(() => {
    const key = "chat_username";
    const cached = localStorage.getItem(key);
    if (cached) return cached;
    const gen = prompt("請輸入暱稱：", `user${Math.floor(Math.random() * 10000)}`) || "";
    localStorage.setItem(key, gen);
    return gen;
  }, []);

  /* 房間狀態 */
  const [room, setRoom] = useState(""); // '' = 公用聊天室
  const roomRef = useRef("");

  /* 未讀狀態 & 操作 */
  const [unread, setUnread] = useState({ "": 0 });

  const incUnread = (target) =>
    setUnread((u) => ({ ...u, [target]: (u[target] || 0) + 1 }));

  const clearUnread = (target) =>
    setUnread((u) => ({ ...u, [target]: 0 }));

  /* expose */
  const value = {
    username,
    room,
    setRoom: (r) => {
      roomRef.current = r;
      setRoom(r);
    },
    roomRef,
    unread,
    incUnread,
    clearUnread,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
