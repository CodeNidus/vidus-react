import React, { useState } from 'react';
import { useVidus } from '../context/VidusContext';
import DeckBtn from '../helpers/DeckBtn';
import './CommandsDeckModule.css';

const CommandsDeckModule = ({ userSettings, setUserSettings, onOpenModule, onRoomLeft }) => {
  const { webrtc } = useVidus();
  const [switcher, setSwitcher] = useState({});

  const muteDevice = (device) => {
    if (device === 'camera') {
      webrtc.Media.muteCamera();
    } else {
      webrtc.Media.muteMicrophone();
    }
  };

  const terminate = () => {
    const action = webrtc.getAction('terminate');

    action.setAsModeratorAction();
    action.run();
  };

  const openModule = (module) => {
    setSwitcher(prev => ({ ...prev, [module]: !prev[module] }));
    
    if (onOpenModule) {
      onOpenModule(module);
    }
  };

  return (
    <div className="command-deck">
      <div className="deck-btn">
        <DeckBtn
          label="Left the room"
          icons={[{ icon: 'phone', status: true }]}
          variant="danger"
          onClick={onRoomLeft}
        />

        <DeckBtn
          label="Terminate"
          icons={[{ icon: 'power', status: true }]}
          variant="danger"
          isCreator
          onClick={terminate}
        />

        <DeckBtn
          label={!userSettings.camDisable ? 'Turn on camera' : 'Turn off camera'}
          icons={[
            { icon: 'video', status: !userSettings.camDisable },
            { icon: 'video-off', status: userSettings.camDisable },
          ]}
          setSwitch={userSettings.camDisable}
          onClick={() => muteDevice('camera')}
        />

        <DeckBtn
          label={!userSettings.micDisable ? 'Turn on microphone' : 'Turn off microphone'}
          icons={[
            { icon: 'microphone', status: !userSettings.micDisable },
            { icon: 'microphone-off', status: userSettings.micDisable },
          ]}
          setSwitch={userSettings.micDisable}
          onClick={() => muteDevice('microphone')}
        />

        <DeckBtn
          label="Chat"
          className={userSettings.newMessage ? 'notify' : ''}
          icons={[{ icon: 'chat-processing', status: true }]}
          onClick={() => openModule('chat')}
        />

        <DeckBtn
          label="People"
          className={userSettings.newAdmitRequest ? 'notify' : ''}
          icons={[{ icon: 'account-multiple', status: true }]}
          onClick={() => openModule('people')}
        />

        {webrtc.configs.development?.canvas?.enable && (
          <DeckBtn
            label="Canvas"
            icons={[{ icon: 'file-document', status: true }]}
            setSwitch={switcher?.canvas}
            isCreator
            onClick={() => openModule('canvas')}
          />
        )}

        <DeckBtn
          label={!userSettings.share ? 'Enable screen share' : 'Disable screen share'}
          icons={[{ icon: 'monitor-share', status: true }]}
          setSwitch={userSettings.share}
          disableOnPhone
          onClick={() => openModule('screen')}
        />

        <DeckBtn
          label={!userSettings.record ? 'Start record' : 'Stop record'}
          icons={[
            { icon: 'record-circle', status: !userSettings.record },
            { icon: 'stop', status: userSettings.record },
          ]}
          variant="danger"
          isCreator
          disableOnFirefox
          onClick={() => openModule('record')}
        />
      </div>
    </div>
  );
};

export default CommandsDeckModule;

