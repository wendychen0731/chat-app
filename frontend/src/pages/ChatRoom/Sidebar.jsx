/**
 * Sidebar.jsx
 *
 * 側邊欄元件，顯示在線用戶清單與未讀訊息提醒。
 *
 * 職責：
 *   1. 從 ChatContext 取得當前房間(room)、切換房間(setRoom)、
 *      同步房間 ref(roomRef)、未讀計數(unread)與清除未讀(clearUnread)等操作。
 *   2. 固定顯示「公用聊天室」選項，及動態渲染線上使用者列表。
 *   3. 點擊時切換房間並清除該房間的未讀訊息計數。
 */
import React, { useContext } from "react";
import { ChatContext } from "@/contexts/ChatContext";
import UserListItem from "@/components/UserListItem";

/**
 * Sidebar - 顯示在線用戶的側邊欄
 *
 * @returns {JSX.Element}
 */
export default function Sidebar() {
  // 從 Context 取得聊天相關狀態與操作函式
  const { room, setRoom, roomRef, unread, clearUnread } = useContext(ChatContext);
  // users 列表：使用另一種 useContext 方式也可取得相同內容
  const { users } = useContext(ChatContext);

  /**
   * selectRoom - 切換聊天室房間並清除該房間的未讀訊息
   * @param {string} next - 要切換的房間 key (空字串代表公用聊天室)
   */
  const selectRoom = (next) => {
    roomRef.current = next;      // 更新 ref 以供 WebSocket callback 使用
    setRoom(next);               // 更新 Context 中的房間狀態
    clearUnread(next);           // 清除該房間的未讀計數
  };

  return (
    // 外層 <aside> 設定寬度、分隔線、內邊距與背景色
    <aside style={{ width: 300, borderLeft: "1px solid #ddd", padding: 16, background: "#fafafa" }}>
      {/* 標題 */}
      <h3>在線用戶</h3>

      {/* 使用者列表，無預設列表樣式 */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {/* 固定顯示公用聊天室項目 */}
        <UserListItem
          username="公用聊天室"
          active={room === ""}            // 判斷是否為當前房間
          unreadCnt={unread[""]}         // 公用聊天室的未讀計數
          onSelect={() => selectRoom("")}  // 點擊時切換到公用聊天室
        />

        {/* 動態渲染其他線上使用者 */}
        {users?.filter(u => u !== username).map((u) => (
          <UserListItem
            key={u}
            username={u}                  // 使用者名稱作為鍵與顯示文字
            active={room === u}           // 判斷是否為當前選中
            unreadCnt={unread[u]}         // 該使用者私聊的未讀計數
            onSelect={() => selectRoom(u)} // 切換到對應私聊房間
          />
        ))}
      </ul>
    </aside>
  );
}