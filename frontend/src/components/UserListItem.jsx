import React from "react";

export default function UserListItem({ username, active, unreadCnt, onSelect }) {
  return (
    <li
      style={{
        cursor: "pointer",
        fontWeight: active ? 700 : 400,
        padding: "4px 0",
        color: active ? "#ad4e00" : "#333",
      }}
      onClick={() => onSelect(username)}
    >
      {active ? "🟢" : "🔹"} {username}
      {unreadCnt > 0 && <span style={{ marginLeft: 4, fontSize: 12, color: "#f5222d" }}>🔴</span>}
    </li>
  );
}
