import React from 'react';
import { useVidus } from '../context/VidusContext';
import Icon from './Icon';

const DeckBtn = ({ 
  label, 
  icons, 
  variant = 'default', 
  setSwitch = false, 
  isCreator = false,
  disableOnFirefox = false,
  disableOnPhone = false,
  onClick,
  className = ''
}) => {
  const { webrtc } = useVidus();

  const checkPermission = () => {
    if (isCreator && !webrtc.userSettings.isCreator) return false;
    if (disableOnFirefox && webrtc.isFirefox()) return false;
    if (disableOnPhone && webrtc.isMobileDevice()) return false;
    return true;
  };

  if (!checkPermission()) return null;

  const btnClass = [
    'btn',
    'btn-small',
    'btn-action',
    `btn-${variant}`,
    className,
    { disabled: setSwitch }
  ].filter(Boolean).join(' ');

  return (
    <a className={btnClass} onClick={onClick}>
      <span className="tooltip top">{label}</span>
      {icons.map((icon, index) => 
        icon.status && <Icon key={index} icon={icon.icon} />
      )}
    </a>
  );
};

export default DeckBtn;

