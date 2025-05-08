/**
 * UserListItem.jsx
 *
 * 顯示使用者列表中的單一項目，包含使用者名稱、選中狀態高亮，以及未讀訊息提示。
 *
 * Props:
 * @param {string} username   - 使用者名稱
 * @param {boolean} active     - 是否為目前選中的使用者，用於樣式高亮
 * @param {number} unreadCnt   - 該使用者的未讀訊息數量
 * @param {function(string)} onSelect - 使用者被選取時的回調，參數為被選中的 username
 */
import React from "react";

export default function UserListItem({ username, active, unreadCnt, onSelect }) {
  return (
    <li
      style={{
        cursor: "pointer",            // 滑鼠懸停顯示手型，提示可點擊
        fontWeight: active ? 700 : 400, // 如果 active，字重加粗
        padding: "4px 0",             // 垂直方向內邊距
        color: active ? "#ad4e00" : "#333", // active 與非 active 顏色區分
      }}
      onClick={() => onSelect(username)} // 點擊時呼叫 onSelect 回傳 username
    >
      {/* 顯示綠點🟢或藍色三角🔹表示是否為 active */}
      {active ? "🟢" : "🔹"} {username}
      {/* 若有未讀訊息（unreadCnt > 0），顯示紅點提示 */}
      {unreadCnt > 0 && (
        <span style={{ marginLeft: 4, fontSize: 12, color: "#f5222d" }}>
          🔴
        </span>
      )}
    </li>
  );
}