/**
 * ChatMain.jsx
 *
 * 聊天主視圖元件，整合上下文、WebSocket 連線、歷史訊息拉取、訊息列表顯示與輸入框
 *
 * 功能：
 *  1. 透過 ChatContext 取得使用者名稱、當前房間、未讀處理函式等全域狀態
 *  2. useChatSocket 處理 WebSocket 連線、接收即時訊息並更新狀態
 *  3. useChatHistory 拉取切換房間時的歷史訊息
 *  4. 動態變更畫面背景與標題顏色
 *  5. 管理送訊息邏輯 (公聊 vs 私聊) 及離線狀態禁用輸入
 */
import React, { useContext, useEffect } from "react";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { ChatContext } from "@/contexts/ChatContext";
import useChatSocket from "@/hooks/useChatSocket";
import useChatHistory from "@/hooks/useChatHistory";

/**
 * ChatMain - 聊天主元件
 */
export default function ChatMain() {
  // 從 Context 取得全域聊天狀態與操作
  const { username, room, roomRef, incUnread } = useContext(ChatContext);
  // 初始化 WebSocket，並取得即時訊息與使用者列表
  const { messages, wsRef } = useChatSocket(username, roomRef, incUnread);
  // 取得拉取歷史訊息的函式
  const { fetchHistory } = useChatHistory(username);

  /**
   * send - 發送訊息至 Server
   * 根據 room 是否為空字串決定公聊或私聊封包格式
   * @param {string} txt - 要送出的訊息文字
   */
  const send = (txt) => {
    const pkt =
      room === ""
        ? { type: "message", message: txt } // 公聊訊息格式
        : { type: "private", to: room, message: txt }; // 私聊訊息格式
    wsRef.current?.send(JSON.stringify(pkt));
  };

  /**
   * 當 room 變更時，拉取對應房間的歷史訊息
   */
  useEffect(() => {
    fetchHistory(room).then((msgs) => {
      // 使用 socket reducer 來更新訊息
      // 可於此合併現有訊息：dispatch({ type: 'SET_MESSAGES', payload: msgs })
    });
  }, [room, fetchHistory]);

  // 判斷 WebSocket 連線狀態，非 OPEN 時禁用輸入
  const ready = wsRef.current?.readyState;
  const disabled = ready !== WebSocket.OPEN;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 600,
        background: room === "" ? "#e6f7ff" : "#fff9e6", // 公聊/私聊背景色
        transition: "background-color .3s",
        padding: 16,
      }}
    >
      {/* 標題：公聊或私聊房間與使用者暱稱顯示 */}
      <h4 style={{ marginBottom: 8, color: room === "" ? "#0050b3" : "#ad4e00" }}>
        {room === ""
          ? `🌐 公用聊天室 - 暱稱：${username}`
          : `🔒 私聊 - 和 ${room}`}
        {/* 離線顯示 */}
        {disabled && <span style={{ color: "red" }}> (離線)</span>}
      </h4>

      {/* 訊息列表 */}
      <MessageList messages={messages} username={username} />
      {/* 訊息輸入框 */}
      <MessageInput disabled={disabled} onSend={send} />
    </div>
  );
}