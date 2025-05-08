/**
 * ChatContext.jsx
 *
 * 聊天應用全域狀態管理 Context 模組：
 * 1. 提供使用者暱稱的確認機制，不再在 Context 內呼叫 prompt。
 * 2. 利用 isConfirmed 控制聊天相關邏輯的啟動時機，可在 UI 層顯示暱稱輸入覆蓋層。
 * 3. 管理房間選擇(room)、未讀計數(unread)與對應操作函式。
 */
import React, { createContext, useState, useRef } from "react";

/**
 * ChatContext - 儲存與共享聊天全域狀態與操作
 * @property {string} username - 已確認的使用者暱稱
 * @property {boolean} isConfirmed - 暱稱是否已確認，控制是否啟動聊天邏輯
 * @property {function(string): boolean} confirmUsername - 驗證並設定使用者暱稱，回傳是否成功
 * @property {string} room - 當前房間 ID，空字串代表公聊
 * @property {function(string): void} setRoom - 設定當前房間，並同步更新 roomRef
 * @property {{ current: string }} roomRef - 使用 useRef 保持最新房間值，供 WebSocket callback 使用
 * @property {{ [roomId: string]: number }} unread - 各房間的未讀訊息計數
 * @property {function(string): void} incUnread - 增加指定房間的未讀計數
 * @property {function(string): void} clearUnread - 清空指定房間的未讀計數
 */
export const ChatContext = createContext(null);

/**
 * ChatProvider - 聊天 Context 提供者
 * 包含：
 *  1. 使用者暱稱的確認與儲存機制
 *  2. 房間(room)控制與同步引用(roomRef)
 *  3. 未讀訊息計數管理
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子元件
 */
export function ChatProvider({ children }) {
  /**
   * 狀態：username
   * - 從 localStorage 讀取先前儲存的暱稱，若無或為空則設為空字串
   */
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem("chat_username");
    return saved && saved.trim() ? saved.trim() : "";
  });

  /**
   * 標記使用者是否已確認暱稱
   * - 只有在 isConfirmed 為 true 時，才會啟動聊天 WebSocket 等相關邏輯
   */
  const isConfirmed = !!username;

  /**
   * 函式：confirmUsername(name)
   * - 由外部 UI 呼叫，傳入使用者輸入的暱稱
   * - 若 name 經過 trim 後為非空字串，則儲存至 localStorage 與 state
   * - 回傳 boolean 表示是否成功設定
   */
  const confirmUsername = (name) => {
    const n = name.trim();
    if (!n) return false;                      // 輸入為空，不設定
    localStorage.setItem("chat_username", n); // 永久儲存
    setUsername(n);                             // 更新 state
    return true;
  };

  /**
   * 狀態：room (當前聊天室)
   * - 空字串表示公用聊天室，否則為某個使用者的私聊
   * - 透過 setRoom 更新時，同步更新 roomRef
   */
  const [room, setRoomState] = useState("");
  const roomRef = useRef("");
  const setRoom = (r) => {
    roomRef.current = r;   // 即時更新 ref 以供 callback 使用
    setRoomState(r);       // 更新 state
  };

  /**
   * 狀態：unread (未讀訊息計數)
   * - 以物件形式儲存各房間的未讀數量，key 為 room ID
   * - 默認包含公用聊天室 key: ""
   */
  const [unread, setUnread] = useState({ "": 0 });

  /**
   * 函式：incUnread(target)
   * - 增加指定房間(target)的未讀數量
   */
  const incUnread = (target) =>
    setUnread((u) => ({ ...u, [target]: (u[target] || 0) + 1 }));

  /**
   * 函式：clearUnread(target)
   * - 清空指定房間(target)的未讀數量
   */
  const clearUnread = (target) =>
    setUnread((u) => ({ ...u, [target]: 0 }));

  /**
   * Context 提供的值
   */
  const value = {
    /* 登入相關 */
    username,
    isConfirmed,
    confirmUsername,
    /* 聊天相關 */
    room,
    setRoom,
    roomRef,
    unread,
    incUnread,
    clearUnread,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}