import React from 'react';
import './Dialog.css';

const Dialog = ({ isOpen, title, children }) => {
  if (!isOpen) return null;

  const onClose = () => {
    isOpen = false;
  }

  return (
    <div className="vidus-dialog-box">
      <div className="vidus-dialog-box-back" onClick={onClose}></div>
      <div className="vidus-dialog-box-content">
        {title && (
          <div className="vidus-dialog-box-title">
            {title}
          </div>
        )}
        <div className="vidus-dialog-box-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;

