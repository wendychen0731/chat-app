import React, { useContext } from "react";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { ChatContext } from "@/contexts/ChatContext";
import useChatSocket from "@/hooks/useChatSocket";
import useChatHistory from "@/hooks/useChatHistory";

export default function ChatMain() {
  const { username, room, roomRef, incUnread } = useContext(ChatContext);
  const { messages, wsRef } = useChatSocket(username, roomRef, incUnread);
  const { fetchHistory } = useChatHistory(username);

  /* 送訊息 */
  const send = (txt) => {
    const pkt = room === "" ? { type: "message", message: txt } : { type: "private", to: room, message: txt };
    wsRef.current?.send(JSON.stringify(pkt));
  };

  /* room 變更時抓歷史 */
  React.useEffect(() => {
    fetchHistory(room).then((msgs) => {
      // 這裡簡單覆蓋；若要保留舊訊息可自行合併
      // setMessages 交給 socket reducer；此處只是預設
    });
  }, [room, fetchHistory]);

  const ready = wsRef.current?.readyState;
  const disabled = ready !== WebSocket.OPEN;

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 600,
      background: room === "" ? "#e6f7ff" : "#fff9e6",
      transition: "background-color .3s",
      padding: 16,
    }}>
      <h4 style={{ marginBottom: 8, color: room === "" ? "#0050b3" : "#ad4e00" }}>
        {room === "" ? `🌐 公用聊天室 - 暱稱：${username}` : `🔒 私聊 - 和 ${room}`}
        {disabled && <span style={{ color: "red" }}> (離線)</span>}
      </h4>

      <MessageList messages={messages} username={username} />
      <MessageInput disabled={disabled} onSend={send} />
    </div>
  );
}
