import React from 'react'

const TopBar: React.FC = () => (
  <div className="topbar">
    <div className="window-controls">
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
    </div>
    <div className="browser-nav">
      <span>{'<'}</span>
      <span>{'>'}</span>
      <span>{'↻'}</span>
    </div>
    <div className="address-bar"></div>
  </div>
);

export default TopBar
