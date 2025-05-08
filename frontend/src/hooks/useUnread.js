/**
 * useUnread.js
 *
 * 提供未讀訊息計數的自訂 Hook，適用於簡易場景下的狀態管理。
 * 如果你已將 unread 狀態存放在全域 store（如 Context、Redux、Pinia）中，可不需要此 Hook。
 *
 * @returns {{
*   unread: { [roomKey: string]: number },  // 各房間的未讀訊息計數，初始包含公聊的 key: ""
*   incUnread: function(string): void,       // 增加指定房間的未讀計數
*   clearUnread: function(string): void      // 清空指定房間的未讀計數
* }}
*/
import { useCallback, useState } from "react";

export default function useUnread() {
 /**
  * unread - 儲存各房間未讀訊息數量，key 為房間識別字串
  */
 const [unread, setUnread] = useState({ "": 0 });

 /**
  * incUnread - 對指定房間的未讀數量 +1
  * @param {string} roomKey - 房間識別字串，空字串代表公聊
  */
 const incUnread = useCallback((roomKey) => {
   setUnread((u) => ({
     ...u,
     [roomKey]: (u[roomKey] || 0) + 1,
   }));
 }, []);

 /**
  * clearUnread - 清空指定房間的未讀計數
  * @param {string} roomKey - 房間識別字串，空字串代表公聊
  */
 const clearUnread = useCallback((roomKey) => {
   setUnread((u) => ({
     ...u,
     [roomKey]: 0,
   }));
 }, []);

 return { unread, incUnread, clearUnread };
}