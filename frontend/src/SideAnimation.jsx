// frontend/src/SideAnimation.jsx
import React from 'react';
import Lottie from 'lottie-react';
import animationData from './animations/Animation - 1746521156039';

export default function SideAnimation({ width = 100, height = 100 }) {
  return (
    <div style={{ width, height }}>
      <Lottie
        animationData={animationData}
        loop={true}           // 持續播放
        autoplay={true}       // 自動啟動
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
