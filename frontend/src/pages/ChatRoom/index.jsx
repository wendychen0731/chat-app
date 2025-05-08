/**
 * ChatRoomPage.jsx
 *
 * 聊天室頁面路由入口元件，負責提供全域聊天狀態 Context 並佈局主區域與側邊欄。
 * 職責：
 *   1. 使用 ChatProvider 包覆整個聊天室生態系，提供 username、room、unread 等狀態
 *   2. 配置版面：左側主區(ChatMain)顯示訊息與輸入框，右側(Sidebar)顯示在線用戶清單與未讀提醒
 * 其餘功能與細節由子元件處理。
 */
import React from "react";

// Context Provider（共享 username / room / unread 等全域狀態）
import { ChatProvider } from "@/contexts/ChatContext";
// 主區元件：訊息列表 + 訊息輸入框
import ChatMain from "./ChatMain";
// 側邊欄元件：在線用戶列表 + 未讀提醒
import Sidebar from "./Sidebar";
// 版面 CSS Module 樣式
import styles from "./styles.module.css";

/**
 * ChatRoomPage
 * @returns {JSX.Element} 聊天室頁面結構
 */
export default function ChatRoomPage() {
  return (
    <ChatProvider>
      {/* 佈局容器：使用 CSS Module 定義的 layout 样式 */}
      <div className={styles.layout}>
        {/* 主區：即時聊天 */}
        <ChatMain />
        {/* 側邊欄：顯示在線用戶與未讀計數 */}
        <Sidebar />
      </div>
    </ChatProvider>
  );
}