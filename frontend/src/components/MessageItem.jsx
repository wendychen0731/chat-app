import React from "react";
import styles from "./MessageItem.module.css";

export default React.memo(function MessageItem({ msg, isOwn }) {
  if (msg.system) {
    return (
      <div className={styles.system}> {msg.text} <small>({msg.created_at})</small> </div>
    );
  }

  const sender = msg.from ?? msg.username;
  return (
    <div className={isOwn ? styles.bubbleOwn : styles.bubbleOther}>
      <div className={styles.meta}>
        <strong>{sender}</strong> <span>[{msg.created_at}]</span>
      </div>
      <div>{msg.message}</div>
    </div>
  );
});
