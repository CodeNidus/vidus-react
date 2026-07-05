import React from 'react';
import Icon from './Icon';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, title, children, id }) => {
  if (!isOpen) return null;

  const closeSidebar = () => {
    onClose(false);
  }

  return (
    <div className="module">
      <div id={`${id ? id : ''}`} className={`module-box sidebar`}>
        <div className="module-box-heading">
          {title && <h3>{title}</h3>}
          <span className="close" onClick={() => closeSidebar()}>
            <Icon icon="close" />
          </span>
        </div>
        <div className="module-box-interface">
          {children}
        </div>
      </div>
      <div className="module-back" onClick={() => closeSidebar()}></div>
    </div>
  );
};

export default Sidebar;

