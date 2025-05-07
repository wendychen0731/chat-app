// frontend/src/App.jsx
import React from 'react';
import ChatRoom from './ChatRoom';
import SideAnimation from './SideAnimation';

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',    // 上方對齊
        gap: '1rem',                  // 聊天室和動畫間距
        padding: '1rem'
      }}
    >
      <div style={{ flex: 1 }}>
        <ChatRoom />
      </div>
      <SideAnimation width={200} height={400} />
    </div>
  );
}
