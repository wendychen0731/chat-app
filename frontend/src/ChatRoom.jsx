import React, { useEffect, useState, useRef, useCallback } from 'react';

export default function ChatRoom() {
  const KEY = 'chat_username';
  /* 1️⃣ 狀態：暫存輸入、使用者名稱、是否已確認 */
  const [tempName, setTempName] = useState('');
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return saved && saved.trim() ? saved.trim() : '';
  });
  const [isConfirmed, setIsConfirmed] = useState(() => !!username);

  /* 2️⃣ 只有在確認後才執行後續邏輯 */
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [users, setUsers]       = useState([]);
  const [room, setRoom]         = useState('');
  const [unread, setUnread]     = useState({ '': 0 });

  /* refs */
  const wsRef   = useRef(null);
  const endRef  = useRef(null);
  const roomRef = useRef(room);

  /* 未讀邏輯 */
  const incUnread = useCallback(target => {
    setUnread(prev => ({
      ...prev,
      [target]: (prev[target] || 0) + 1,
    }));
  }, []);
  const clearUnread = useCallback(target => {
    setUnread(prev => ({ ...prev, [target]: 0 }));
  }, []);

  /* 抓歷史訊息 */
  const fetchHistory = useCallback(targetRoom => {
    const base = import.meta.env.VITE_HTTP_HISTORY_URL;
    const url  = targetRoom === ''
      ? base
      : `${base}?user=${username}&peer=${targetRoom}`;
    fetch(url)
      .then(r => r.json())
      .then(setMessages)
      .catch(console.error);
  }, [username]);

  /* 抓線上列表 */
  const fetchUsers = useCallback(() => {
    fetch(import.meta.env.VITE_HTTP_USERS_URL)
      .then(r => r.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  /* WebSocket 初始化 */
  const initWebSocket = useCallback(() => {
    wsRef.current?.close();
    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', username }));
    };

    socket.onmessage = e => {
      const pkt = JSON.parse(e.data);
      if (pkt.type === 'error') {
        alert(pkt.message);
        window.location.reload();
        return;
      }
      if (pkt.type === 'history') { setMessages(pkt.messages); return; }
      if (pkt.type === 'user_list') { setUsers(pkt.users); return; }
      if (pkt.type === 'join') {
        setUsers(u => (u.includes(pkt.username) ? u : [...u, pkt.username]));
        setMessages(m => [...m, { system: true, text: `${pkt.username} 加入`, created_at: pkt.created_at }]);
        return;
      }
      if (pkt.type === 'leave') {
        setUsers(u => u.filter(x => x !== pkt.username));
        setMessages(m => [...m, { system: true, text: `${pkt.username} 離開`, created_at: pkt.created_at }]);
        return;
      }
      if (pkt.type === 'message') {
        if (roomRef.current === '') {
          setMessages(m => [...m, pkt]);
        } else {
          incUnread('');
        }
        return;
      }
      if (pkt.type === 'private') {
        const peer = pkt.from === username ? pkt.to : pkt.from;
        if (peer === roomRef.current) {
          setMessages(m => [...m, pkt]);
        } else {
          incUnread(peer);
        }
        return;
      }
    };

    socket.onclose = () => {};
    socket.onerror = () => {};
  }, [username, incUnread]);

  /* 可見性 & 重連 */
  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'visible') {
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        fetchHistory(roomRef.current);
        fetchUsers();
        initWebSocket();
      }
    }
  }, [fetchHistory, fetchUsers, initWebSocket]);

  /* 主流程：只有確認後才執行 */
  useEffect(() => {
    if (!isConfirmed) return;
    fetchHistory(roomRef.current);
    fetchUsers();
    initWebSocket();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wsRef.current?.close();
    };
  }, [isConfirmed, fetchHistory, fetchUsers, initWebSocket, handleVisibility]);

  /* 捲到底 */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* 送訊息 */
  const sendMessage = () => {
    const txt = input.trim(); if (!txt) return;
    const payload = roomRef.current === ''
      ? { type: 'message', message: txt }
      : { type: 'private', to: roomRef.current, message: txt };
    wsRef.current.send(JSON.stringify(payload));
    setInput('');
  };

  /* 連線狀態 */
  const ready        = wsRef.current?.readyState;
  const isConnected  = ready === WebSocket.OPEN;
  const isConnecting = ready === WebSocket.CONNECTING;

  /* 設定按鈕事件 */
  const handleConfirm = () => {
    if (!tempName.trim()) {
      alert('暱稱不得為空');
      return;
    }
    localStorage.setItem(KEY, tempName.trim());
    setUsername(tempName.trim());
    setIsConfirmed(true);
  };

  /* 缺少樣式定義，需補上 */
  const mainStyle = {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: room === '' ? '#e6f7ff' : '#fff9e6',
    transition: 'background-color 0.3s ease',
    minWidth: 600,
  };
  const headerStyle = {
    marginBottom: 8,
    color: room === '' ? '#0050b3' : '#ad4e00',
  };

  /* UI */
  if (!isConfirmed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h3>請輸入暱稱才可進入聊天室</h3>
        <input
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          placeholder="輸入暱稱…"
          style={{ padding: '8px', width: 200, marginBottom: 8 }}
        />
        <button onClick={handleConfirm} style={{ padding: '8px 16px' }}>確定</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', minWidth: 600 }}>
      {/* 主區域 */}
      <div style={mainStyle}>
        <h4 style={headerStyle}>
          {room === '' ? `🌐 公用聊天室 - 暱稱：${username}` : `🔒 私聊 - 和 ${room}`}
          {(!isConnected && !isConnecting) && <span style={{ color: 'red' }}> (已斷線)</span>}
        </h4>

        {/* 訊息列表 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: 8,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {messages.map((m, i) => {
            if (m.system) {
              return (
                <div
                  key={i}
                  style={{
                    margin: '4px 0',
                    backgroundColor: '#fafafa',
                    borderRadius: 4,
                    padding: '4px 8px',
                    alignSelf: 'center',
                    fontStyle: 'italic',
                    color: '#888',
                  }}
                >
                  {m.text} <small>({m.created_at})</small>
                </div>
              );
            }

            const sender = m.from ?? m.username;
            const isOwn  = sender === username;
            const bubbleStyle = {
              margin: '4px 0',
              padding: '8px 12px',
              borderRadius: 12,
              backgroundColor: isOwn ? '#d9fdd3' : '#f5f5f5',
              alignSelf: isOwn ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
            };

            return (
              <div key={i} style={bubbleStyle}>
                <div style={{ fontSize: '0.85em', marginBottom: 4 }}>
                  <strong>{sender}</strong>{' '}<span>[{m.created_at}]</span>
                </div>
                <div>{m.message}</div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* 輸入區 */}
        <div style={{ display: 'flex', marginTop: 8 }}>
          <input
            style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ccc' }}
            disabled={!isConnected}
            placeholder={
              isConnected ? '輸入訊息…' : isConnecting ? '連線中…' : '離線，請切換頁籤再回來…'
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyUp={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            disabled={!isConnected}
            onClick={sendMessage}
            style={{
              marginLeft: 8,
              padding: '8px 16px',
              borderRadius: 4,
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            送出
          </button>
        </div>
      </div>

      {/* 側邊在線名單 */}
      <aside style={{
        width: 300,
        borderLeft: '1px solid #ddd',
        padding: 16,
        overflowY: 'auto',
        background: '#fafafa'
      }}>
        <h3>在線用戶</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {/* 公聊固定第一 */}
          <li
            key="public"
            style={{
              cursor: 'pointer',
              fontWeight: room === '' ? 700 : 400,
              padding: '4px 0',
              color: room === '' ? '#0050b3' : '#333',
            }}
            onClick={() => {
              roomRef.current = '';
              setRoom('');
              setMessages([]);
              fetchHistory('');
              clearUnread('');                    // 🆕 清公用未讀
            }}
          >
            {room === '' ? '🟢' : '🔹'} 公用聊天室
            {unread[''] > 0 && <span style={{
              marginLeft: 4,
              fontSize: 12,
              color: '#f5222d',
            }}>🔴</span>}
          </li>

          {/* 私聊清單 */}
          {users.filter(u => u !== username).map(u => (
            <li
              key={u}
              style={{
                cursor: 'pointer',
                fontWeight: room === u ? 700 : 400,
                padding: '4px 0',
                color: room === u ? '#ad4e00' : '#333',
              }}
              onClick={() => {
                const nextRoom = roomRef.current === u ? '' : u;
                roomRef.current = nextRoom;
                setRoom(nextRoom);
                setMessages([]);
                fetchHistory(nextRoom);
                clearUnread(nextRoom);            // 🆕 清該私聊未讀
              }}
            >
              {room === u ? '🟢' : '🔹'} {u}
              {unread[u] > 0 && <span style={{
                marginLeft: 4,
                fontSize: 12,
                color: '#f5222d',
              }}>🔴</span>}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
