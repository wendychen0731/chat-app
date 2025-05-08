import React, { useContext } from "react";
import { ChatContext } from "@/contexts/ChatContext";
import UserListItem from "@/components/UserListItem";

export default function Sidebar() {
  const { room, setRoom, roomRef, unread, clearUnread } = useContext(ChatContext);
  const { users } = React.useContext(ChatContext);

  const selectRoom = (next) => {
    roomRef.current = next;
    setRoom(next);
    clearUnread(next);
  };

  return (
    <aside style={{ width: 300, borderLeft: "1px solid #ddd", padding: 16, background: "#fafafa" }}>
      <h3>在線用戶</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {/* 公用聊天室 fixed */}
        <UserListItem
          username="公用聊天室"
          active={room === ""}
          unreadCnt={unread[""]}
          onSelect={() => selectRoom("")}
        />
        {users?.map((u) => (
          <UserListItem
            key={u}
            username={u}
            active={room === u}
            unreadCnt={unread[u]}
            onSelect={() => selectRoom(u)}
          />
        ))}
      </ul>
    </aside>
  );
}
