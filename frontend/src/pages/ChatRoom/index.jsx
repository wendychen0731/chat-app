import React from "react";

// Context Provider（共享 username / room / unread 等狀態）
import { ChatProvider } from "@/contexts/ChatContext";
// 主要畫面：訊息列表 + 輸入框
import ChatMain from "./ChatMain";
// 側邊欄：在線用戶 + 未讀提醒
import Sidebar from "./Sidebar";
// 版面樣式
import styles from "./styles.module.css";

/**
 * ChatRoomPage — Route 入口
 *
 * 📌 職責：
 *   1. 提供 ChatProvider，包住整個聊天室生態系
 *   2. 負責版面配置（主區域 / 側邊欄）
 *   其餘功能與畫面細節交給 child components 處理。
 */
export default function ChatRoomPage() {
  return (
    <ChatProvider>
      <div className={styles.layout}>
        <ChatMain />
        <Sidebar />
      </div>
    </ChatProvider>
  );
}
