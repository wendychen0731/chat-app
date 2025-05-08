import { useCallback, useEffect, useReducer, useRef } from "react";
import { initWs } from "@/utils/ws";

const initialState = { messages: [], users: [] };

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

/**
 * useChatSocket — 封裝所有 WebSocket 事件
 *
 * @param {string} username
 * @param {React.MutableRefObject<string>} roomRef
 * @param {function(string):void} incUnread
 * @returns { messages, users, wsRef, dispatch }
 */
export default function useChatSocket(username, roomRef, incUnread) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef(null);

  // handler extract
  const handlePkt = useCallback(
    (pkt) => {
      switch (pkt.type) {
        case "history":
          dispatch({ type: "SET_MESSAGES", payload: pkt.messages });
          break;
        case "user_list":
          dispatch({ type: "SET_USERS", payload: pkt.users });
          break;
        case "join":
        case "leave":
          // system message + 更新 users
          dispatch({ type: "SET_USERS", payload: pkt.users ?? [] });
          dispatch({ type: "APPEND_MESSAGE", payload: pkt });
          break;
        case "message":
          roomRef.current === ""
            ? dispatch({ type: "APPEND_MESSAGE", payload: pkt })
            : incUnread("");
          break;
        case "private":
          const peer = pkt.from === username ? pkt.to : pkt.from;
          peer === roomRef.current
            ? dispatch({ type: "APPEND_MESSAGE", payload: pkt })
            : incUnread(peer);
          break;
        default:
          break;
      }
    },
    [username, roomRef, incUnread]
  );

  // connect once
  useEffect(() => {
    const ws = initWs();
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "join", username }));
    ws.onmessage = (e) => handlePkt(JSON.parse(e.data));

    return () => ws.close();
  }, [username, handlePkt]);

  return { ...state, wsRef, dispatch };
}
