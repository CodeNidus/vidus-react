import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import Sidebar from '../helpers/Sidebar';
import Icon from '../helpers/Icon';
import admitAudio from '../assets/audio/admit.mp3';
import './PeopleModule.css';

const PeopleModule = React.forwardRef(({ webrtc: webrtcProp, waitingList: waitingListProp = [] }, ref) => {
  const { webrtc: webrtcContext } = useVidus();
  const webrtc = webrtcProp || webrtcContext;
  const [isOpen, setIsOpen] = useState(false);
  const [usersMenu, setUsersMenu] = useState([]);
  const [showWaitList, setShowWaitList] = useState(true);
  const audioRef = useRef(null);
  const [room, setRoom] = useState();

  const waitingList = waitingListProp || [];

  const isCreator = useMemo(() => {
    return webrtc.userSettings.isCreator;
  }, [webrtc.userSettings.isCreator]);

  useEffect(() => {
    const connections = webrtc.People.getConnections();
    const menu = [{
      name: webrtc.options.name + ' (You)',
      peerJsId: webrtc.peerJsId,
      openMenu: false,
    }];

    connections.forEach((item) => {
      menu.push({
        name: item.name,
        peerJsId: item.peerJsId,
        micMute: item.micMute,
        openMenu: false,
      });
    });

    setUsersMenu(menu);
  }, [webrtc]);

  useEffect(() => {
    const eventHandlerRequestToAdmit = () => {
      if (audioRef.current) {
        audioRef.current.play();
      }
      if (!isOpen) {
        webrtc.userSettings.newAdmitRequest = true;
      }
    };

    const eventHandlerCancelForAdmit = () => {
      if (waitingList.length === 0) {
        webrtc.userSettings.newAdmitRequest = false;
      }
    };

    const hideMenu = (event) => {
      if (!event.target.matches('.dropdown-content') &&
        !event.target.matches('.dropdown-dots')) {
        setUsersMenu(prev => prev.map(user => ({ ...user, openMenu: false })));
      }
    };

    document.addEventListener('click', hideMenu);
    document.addEventListener('onAdmissionRequest', eventHandlerRequestToAdmit);
    document.addEventListener('onAdmissionCancel', eventHandlerCancelForAdmit);
    audioRef.current = new Audio(admitAudio);

    return () => {
      document.removeEventListener('click', hideMenu);
      document.removeEventListener('onAdmissionRequest', eventHandlerRequestToAdmit);
      document.removeEventListener('onAdmissionCancel', eventHandlerCancelForAdmit);
    };
  }, [webrtc, isOpen, waitingList.length]);

  const toggleMenu = (index) => {
    setUsersMenu(prev => prev.map((user, i) => ({
      ...user,
      openMenu: i === index ? !user.openMenu : false
    })));
  };

  const banUser = (user) => {
    const action = webrtc.getAction('ban');
    action.run(user);
    toggleMenu(usersMenu.findIndex(u => u.peerJsId === user.peerJsId));
  };

  const muteMic = (user) => {
    const action = webrtc.getAction('mute-user-mic');
    action.run(user);
    toggleMenu(usersMenu.findIndex(u => u.peerJsId === user.peerJsId));
  };

  const responseWaiting = (status, user, index) => {
    const action = webrtc.getAction('admit');
    action.run(room, status, user);

    setShowWaitList(false);
    webrtc.People.removeFromWaitingList(index);

    setTimeout(() => {
      setShowWaitList(true);
    }, 100);
  };

  const open = (roomItem) => {
    setIsOpen(true);
    setRoom(roomItem);
    webrtc.userSettings.newAdmitRequest = false;
  };

  React.useImperativeHandle(ref, () => ({ open }));

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={setIsOpen}
      id="people-module"
      title="Peoples"
    >
      <div className="people">
        {usersMenu.map((user, index) => (
          <div key={index} className="user-item">
            <span>{user.name}</span>
            {index > 0 && (
              <div>
                <Icon
                  icon="dots-vertical"
                  className="dropdown-dots"
                  onClick={() => toggleMenu(index)}
                />
                {user.openMenu && (
                  <div className="dropdown-content show">
                    <h3>{user.name}</h3>
                    <ul>
                      {isCreator && <li onClick={() => banUser(user)}>Ban user</li>}
                      {isCreator && !user.micMute && (
                        <li onClick={() => muteMic(user)}>Mute user microphone</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {waitingList.length > 0 && showWaitList && (
          <div className="waitingList">
            <hr />
            {waitingList.map((waiting, index) => (
              <div key={index} className="waitingList-item">
                <span>{waiting.name}</span>
                <div>
                  <span className="btn" onClick={() => responseWaiting(true, waiting, index)}>
                    approve
                  </span>
                  <span className="btn" onClick={() => responseWaiting(false, waiting, index)}>
                    denied
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sidebar>
  );
});

PeopleModule.displayName = 'PeopleModule';

export default PeopleModule;

