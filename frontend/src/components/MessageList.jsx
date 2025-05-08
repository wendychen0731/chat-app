import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, username }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 8 }}> {/* 外層樣式可用 CSS module */}
      {messages.map((m, i) => (
        <MessageItem key={i} msg={m} isOwn={(m.from ?? m.username) === username} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
