/**
 * MessageItem.jsx
 * 
 * 顯示單則訊息的元件，支持系統訊息與一般用戶訊息的不同樣式。
 * 使用 React.memo 進行效能優化，避免不必要的重渲染。
 *
 * Props:
 * @param {Object} props.msg - 訊息物件，可能包含下列欄位：
 *   @param {boolean} props.msg.system - 是否為系統訊息
 *   @param {string} props.msg.text - 系統訊息文字
 *   @param {string} props.msg.created_at - 訊息建立時間
 *   @param {string} [props.msg.from] - 訊息發送者 ID
 *   @param {string} [props.msg.username] - 訊息發送者名稱（替代自 from）
 *   @param {string} [props.msg.message] - 一般用戶訊息文字
 * @param {boolean} props.isOwn - 是否為當前使用者自身的訊息，用以決定樣式
 */
import React from "react";
import styles from "./MessageItem.module.css";

export default React.memo(function MessageItem({ msg, isOwn }) {
  // 若為系統訊息，顯示系統樣式與時間
  if (msg.system) {
    return (
      <div className={styles.system}>
        {msg.text} <small>({msg.created_at})</small>
      </div>
    );
  }

  // 決定顯示的發送者名稱，優先使用 msg.from，否則使用 msg.username
  const sender = msg.from ?? msg.username;

  return (
    // 根據是否為自己的訊息切換不同樣式
    <div className={isOwn ? styles.bubbleOwn : styles.bubbleOther}>
      {/* 訊息 Metadata 顯示發送者與時間 */}
      <div className={styles.meta}>
        <strong>{sender}</strong> <span>[{msg.created_at}]</span>
      </div>
      {/* 訊息內容 */}
      <div>{msg.message}</div>
    </div>
  );
});
