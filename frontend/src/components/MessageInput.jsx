import React, { useState } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div style={{ display: "flex", marginTop: 8 }}>
      <input
        style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        disabled={disabled}
        placeholder={disabled ? "離線…" : "輸入訊息…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
      />
      <button
        disabled={disabled}
        onClick={send}
        style={{ marginLeft: 8, padding: "8px 16px", borderRadius: 4 }}
      >
        送出
      </button>
    </div>
  );
}
