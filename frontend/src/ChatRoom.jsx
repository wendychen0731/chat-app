import React, { useEffect, useState, useRef, useCallback } from 'react';

export default function ChatRoom() {
  // 1️⃣ 使用 localStorage 保留使用者暱稱，避免每次刷新都跳 prompt
  const [username] = useState(() => {
    const key = 'chat_username';
    const stored = localStorage.getItem(key);
    if (stored) return stored;

    const name = prompt('請輸入暱稱：', `user${Math.floor(Math.random()*10000)}`) || '';
    localStorage.setItem(key, name);
    return name;
  });

  // 2️⃣ 對應的 state：訊息列表、輸入框、以及在線使用者列表
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [users, setUsers]     = useState([]);

  // 3️⃣ useRef 來存放 WebSocket 物件與滾動用的 endRef
  const wsRef  = useRef(null);
  const endRef = useRef(null);

  // ────────────────
  // 4️⃣ 拆成獨立函式：只負責向後端 AJAX 抓歷史訊息
  const fetchHistory = useCallback(() => {
    fetch(import.meta.env.VITE_HTTP_HISTORY_URL)
      .then(r => r.json())
      .then(setMessages)    // 直接更新 messages
      .catch(console.error);
  }, []);

  // 5️⃣ 拆成獨立函式：只負責向後端 AJAX 抓在綫使用者列表
  const fetchUsers = useCallback(() => {
    fetch(import.meta.env.VITE_HTTP_USERS_URL)
      .then(r => r.json())
      .then(setUsers)       // 直接更新 users
      .catch(console.error);
  }, []);

  // 6️⃣ 拆成獨立函式：建立／重置 WebSocket 連線
  const initWebSocket = useCallback(() => {
    // 如果已有舊連線，先關閉
    wsRef.current?.close();

    // 建立新 WS，並存到 wsRef
    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = socket;

    // 6.1 onopen 時把 join 訊息發出
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', username }));
    };

    // 6.2 onmessage 時依 type 分流處理
    socket.onmessage = e => {
      const pkt = JSON.parse(e.data);
      if (pkt.type === 'history') {
        // 後端若送 history，也可以用
        setMessages(pkt.messages);
      } else if (pkt.type === 'user_list') {
        // 初始化或更新整個線上名單
        setUsers(pkt.users);
      } else if (pkt.type === 'join') {
        // 有人加入 → 更新名單、顯示系統訊息
        setUsers(u => u.includes(pkt.username) ? u : [...u, pkt.username]);
        setMessages(msgs => [
          ...msgs,
          { system: true, text: `${pkt.username} 加入`, created_at: pkt.created_at }
        ]);
      } else if (pkt.type === 'leave') {
        // 有人離開 → 去除名單、顯示系統訊息
        setUsers(u => u.filter(x => x !== pkt.username));
        setMessages(msgs => [
          ...msgs,
          { system: true, text: `${pkt.username} 離開`, created_at: pkt.created_at }
        ]);
      } else if (pkt.type === 'message') {
        // 新聊天訊息
        setMessages(msgs => [...msgs, pkt]);
      }
    };

    // 6.3 onclose／onerror 不做自動重連，重連由「可見性」機制觸發
    socket.onclose = () => {};
    socket.onerror = () => {};
  }, [username]);

  // ────────────────
  // 7️⃣ 「可見性」變更處理：當頁面切回來、且 WS 已關閉，才重抓資料／重建 WS
  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'visible') {
      const ws = wsRef.current;
      // readyState 3 = CLOSED
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        fetchHistory();
        fetchUsers();
        initWebSocket();
      }
    }
  }, [fetchHistory, fetchUsers, initWebSocket]);

  // ────────────────
  // 8️⃣ 元件初次掛載：做一次「抓歷史、抓名單、開 WS」，並綁可見性事件
  useEffect(() => {
    fetchHistory();
    fetchUsers();
    initWebSocket();

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      // unmount 時關 WS
      wsRef.current?.close();
    };
  }, [fetchHistory, fetchUsers, initWebSocket, handleVisibility]);

  // ────────────────
  // 9️⃣ 新訊息來時自動滾到底
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 1️⃣0️⃣ 傳送訊息函式
  const sendMessage = () => {
    const txt = input.trim();
    if (!txt) return;
    wsRef.current.send(
      JSON.stringify({ type: 'message', username, message: txt })
    );
    setInput('');
  };

  // 1️⃣1️⃣ 連線狀態判斷，用於切換輸入框可不可用、提示文字
  const ready = wsRef.current?.readyState;
  const isConnected  = ready === WebSocket.OPEN;
  const isConnecting = ready === WebSocket.CONNECTING;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 聊天主區 */}
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
        <h4>
          暱稱：{username}
          {(!isConnected && !isConnecting) && <span style={{ color: 'red' }}> (已斷線)</span>}
        </h4>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ margin: '4px 0' }}>
              {m.system
                ? <em>{m.text} <small>({m.created_at})</small></em>
                : <><strong>{m.username}</strong> [{m.created_at}]: {m.message}</>
              }
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          <input
            style={{ flex: 1 }}  // 這裡 flex:1 代表「彈性撐滿剩餘空間」
            disabled={!isConnected}
            placeholder={
              isConnected
                ? '輸入訊息…'
                : isConnecting
                  ? '連線中…'
                  : '離線，請切換頁籤再回來…'
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button disabled={!isConnected} onClick={sendMessage}>
            送出
          </button>
        </div>
      </div>

      {/* 側邊：在線使用者列表 */}
      <aside style={{ width: 200, borderLeft: '1px solid #ddd', padding: 16, overflowY: 'auto' }}>
        <h3>在線用戶</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(u => <li key={u}>🔹 {u}</li>)}
        </ul>
      </aside>
    </div>
  );
}
