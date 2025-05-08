/**
 * useChatSocket.js
 *
 * 自訂 Hook：封裝 WebSocket 聊天邏輯，管理連線、處理封包與狀態更新。
 *
 * @param {string} username - 當前使用者名稱，用於 WebSocket join 事件及 private message 判斷
 * @param {React.MutableRefObject<string>} roomRef - 目前房間 key 的 ref，用於辨別訊息歸屬
 * @param {function(string): void} incUnread - 增加未讀計數的回調函式，參數為目標房間 key
 * @returns {{
*   messages: Object[],       // 已接收的訊息列表
*   users: string[],         // 線上使用者清單
*   wsRef: React.MutableRefObject<WebSocket|null>, // WebSocket 實例的 ref
*   dispatch: function       // 可自訂 dispatch 更新狀態
* }}
*/
import { useCallback, useEffect, useReducer, useRef } from "react";
import { initWs } from "@/utils/ws";

// 初始狀態：空訊息與空使用者列表
const initialState = { messages: [], users: [] };

/**
* reducer - 處理各種 action 更新 state
*/
function reducer(state, action) {
 switch (action.type) {
   case "SET_MESSAGES":
     return { ...state, messages: action.payload };
   case "APPEND_MESSAGE":
     return { ...state, messages: [...state.messages, action.payload] };
   case "SET_USERS":
     return { ...state, users: action.payload };
   default:
     return state;
 }
}

export default function useChatSocket(username, roomRef, incUnread) {
 // useReducer 管理 messages 與 users 狀態
 const [state, dispatch] = useReducer(reducer, initialState);
 // wsRef 用於儲存 WebSocket 實例，保持跨 render 不變
 const wsRef = useRef(null);

 /**
  * handlePkt - 處理從伺服器收到的封包，根據 type 更新 state 或未讀
  * @param {Object} pkt - 來自 WebSocket 的封包物件
  */
 const handlePkt = useCallback(
   (pkt) => {
     switch (pkt.type) {
       case "history":
         // 歷史訊息列表
         dispatch({ type: "SET_MESSAGES", payload: pkt.messages });
         break;
       case "user_list":
         // 更新線上使用者清單
         dispatch({ type: "SET_USERS", payload: pkt.users });
         break;
       case "join":
       case "leave":
         // 系統訊息（加入/離開），同時更新使用者清單與訊息列表
         dispatch({ type: "SET_USERS", payload: pkt.users ?? [] });
         dispatch({ type: "APPEND_MESSAGE", payload: pkt });
         break;
       case "message":
         // 公聊訊息
         if (roomRef.current === "") {
           dispatch({ type: "APPEND_MESSAGE", payload: pkt });
         } else {
           // 在私聊房間外的訊息視為未讀
           incUnread("");
         }
         break;
       case "private": {
         // 私聊訊息，根據發送者或接收者判斷目標
         const peer = pkt.from === username ? pkt.to : pkt.from;
         if (peer === roomRef.current) {
           dispatch({ type: "APPEND_MESSAGE", payload: pkt });
         } else {
           incUnread(peer);
         }
         break;
       }
       default:
         // 忽略其他封包類型
         break;
     }
   },
   [username, roomRef, incUnread]
 );

 /**
  * 建立 WebSocket 連線，並設定事件處理器。
  * 只於 component mount 時執行一次。
  */
 useEffect(() => {
   const ws = initWs();
   wsRef.current = ws;

   // 連線成功後通知 server 加入
   ws.onopen = () => ws.send(JSON.stringify({ type: "join", username }));
   // 接收訊息時呼叫 handlePkt
   ws.onmessage = (e) => handlePkt(JSON.parse(e.data));

   // cleanup：unmount 時關閉連線
   return () => ws.close();
 }, [username, handlePkt]);

 // 回傳目前狀態與 dispatch、wsRef，供元件使用
 return { ...state, wsRef, dispatch };
}
