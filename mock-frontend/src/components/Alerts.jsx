import React from 'react';

export default function Alerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="alert-container">
      {alerts.map(a => (
        <div key={a.id} className={`alert alert-${a.type}`}>
          <i className={a.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}></i>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
