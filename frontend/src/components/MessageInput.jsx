/**
 * MessageInput.jsx
 *
 * 提供使用者輸入訊息的元件，包含文字輸入框與送出按鈕。
 *
 * Props:
 * @param {function(string)} onSend - 傳遞輸入文字給父元件的方法
 * @param {boolean} disabled - 是否停用輸入及送出功能
 */
import React, { useState } from "react";

/**
 * MessageInput 元件
 * @param {Object} props - 元件屬性
 * @param {function(string)} props.onSend - 當使用者送出訊息時呼叫的回調函式
 * @param {boolean} props.disabled - 控制元件是否可編輯及可送出
 */
export default function MessageInput({ onSend, disabled }) {
  // 本地狀態：輸入框的文字內容
  const [text, setText] = useState("");

  /**
   * send 函式 - 處理送出訊息的流程
   * 1. trim 去除前後空白
   * 2. 檢查是否為空字串，若是則中止
   * 3. 呼叫 onSend 傳遞文字給父元件
   * 4. 清空輸入框內容
   */
  const locked = useRef(false);          // 0.2秒鎖：防止連發

  const send = useCallback(() => {
    if (locked.current) return;          // 已經鎖住就跳過
    const t = text.trim();
    if (!t) return;

    locked.current = true;               // 上鎖
    onSend(t);
    setText("");                         // 清空

    setTimeout(() => (locked.current = false), 200); // 200ms 後解鎖
  }, [text, onSend]);

  return (
    <div style={{ display: "flex", marginTop: 8 }}>
      {/* 訊息輸入框 */}
      <input
        style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        disabled={disabled}
        placeholder={disabled ? "離線…" : "輸入訊息…"} // 顯示提示文字
        value={text}
        onChange={(e) => setText(e.target.value)} // 更新輸入框內容
        onKeyUp={e => {
            // e.repeat: 按鍵重複時為 true
            if (e.key === "Enter" && !e.repeat) {
              send();
            }
          }} // 按下 Enter 時送出
      />

      {/* 送出按鈕 */}
      <button
        disabled={disabled}
        onClick={send} // 點擊按鈕時送出
        style={{ marginLeft: 8, padding: "8px 16px", borderRadius: 4 }}
      >
        送出
      </button>
    </div>
  );
}