/**
 * MessageList.jsx
 *
 * 顯示訊息列表的元件，包含自動滾動至最新訊息功能。
 * 使用 useRef 與 useEffect，在 messages 更新時平滑滾動到底部，確保最新訊息可見。
 *
 * Props:
 * @param {Array<Object>} props.messages - 訊息陣列，每項包含 msg 格式
 * @param {string} props.username - 當前使用者名稱，用以判斷訊息是否為自己發送
 */
import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, username }) {
  // 取得末端元素的 ref，用於自動滾動
  const endRef = useRef(null);

  /**
   * 當 messages 更新時，滾動到列表底部
   */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    // 建議將樣式抽離至 CSS module 或 styled-component
    <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
      {/* 遍歷訊息並根據是否為自身訊息渲染 MessageItem */}
      {messages.map((m, i) => (
        <MessageItem
          key={i}
          msg={m}
          isOwn={(m.from ?? m.username) === username} // 判斷是否為自己訊息
        />
      ))}
      {/* 滑動錨點，用於自動滾動 */}
      <div ref={endRef} />
    </div>
  );
}
