import React, { useEffect, useState, useRef } from 'react';

export default function ChatRoom() {
  // 使用者暱稱
  const [username] = useState(() => {
    const key = 'chat_username';
    const stored = localStorage.getItem(key);
    if (stored) return stored;

    const name =
      prompt('請輸入聊天室暱稱：', `user${Math.floor(Math.random() * 10000)}`)?.trim() ||
      `user${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem(key, name);
    return name;
  });

  // 狀態：訊息、輸入、在線名單、連線狀態
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  const ws = useRef(null);
  const endRef = useRef(null);

  // 自動滾動
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 監聽頁面可見性，重新載入以重連
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && !connected) {
        window.location.reload();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [connected]);

  // WebSocket 初始化與事件處理
  useEffect(() => {
    const HTTP_HISTORY_URL = import.meta.env.VITE_HTTP_HISTORY_URL;
    const WS_URL = import.meta.env.VITE_WS_URL;

    // 抓歷史
    fetch(HTTP_HISTORY_URL)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error('歷史抓取失敗：', err));

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: 'join', username }));
    };

    socket.onmessage = e => {
      try {
        const pkt = JSON.parse(e.data);
        switch (pkt.type) {
          case 'history':
            setMessages(pkt.messages);
            break;
          case 'user_list':
            setUsers(pkt.users);
            break;
          case 'join':
            setUsers(prev => prev.includes(pkt.username) ? prev : [...prev, pkt.username]);
            setMessages(prev => [...prev, { system: true, text: `${pkt.username} 加入聊天室`, created_at: pkt.created_at }]);
            break;
          case 'leave':
            setUsers(prev => prev.filter(u => u !== pkt.username));
            setMessages(prev => [...prev, { system: true, text: `${pkt.username} 離開聊天室`, created_at: pkt.created_at }]);
            break;
          case 'message':
            setMessages(prev => [...prev, pkt]);
            break;
          default:
            console.warn('未知訊息類型:', pkt);
        }
      } catch {
        console.error('收到非 JSON 訊息：', e.data);
      }
    };

    socket.onclose = () => {
      console.warn('WebSocket 已關閉');
      setConnected(false);
    };
    socket.onerror = err => {
      console.error('WebSocket 錯誤：', err);
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [username]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !connected) return;
    ws.current.send(JSON.stringify({ type: 'message', username, message: text }));
    setInput('');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', maxWidth: 800, margin: '0 auto' }}>
      {/* 聊天區 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
        <h4>你是：{username}</h4>
        {/* 斷線提示 */}
        {!connected && (
          <div style={{ color: 'red', marginBottom: 8, textAlign: 'center' }}>
            已與伺服器斷線，等待重新連線...
          </div>
        )}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: 4, padding: 8, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {m.system ? (
                <em style={{ color: '#555' }}>
                  {m.text} <small>({m.created_at})</small>
                </em>
              ) : (
                <>
                  <strong>{m.username}</strong>
                  <small style={{ color: '#888', marginLeft: 8 }}>[{m.created_at}]</small>：
                  <span style={{ marginLeft: 4 }}>{m.message}</span>
                </>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ display: 'flex', marginTop: 8 }}>
          <input
            style={{ flex: 1, padding: 8, fontSize: 16 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={connected ? '輸入訊息，Enter 送出' : '連線中...'}
            disabled={!connected}
          />
          <button
            style={{ marginLeft: 8, padding: '0 16px' }}
            onClick={sendMessage}
            disabled={!connected}
          >
            送出
          </button>
        </div>
      </div>

      {/* 在線名單 */}
      <aside style={{ width: 200, borderLeft: '1px solid #ccc', padding: 16, overflowY: 'auto' }}>
        <h3>在線用戶</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(u => (
            <li key={u} style={{ margin: '4px 0' }}>🔹 {u}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
