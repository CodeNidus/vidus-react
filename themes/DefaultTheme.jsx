import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVidus } from '../context/VidusContext';
import Icon from '../helpers/Icon';
import './DefaultTheme.css';

const DefaultTheme = ({ connections, userSettings, children }) => {
  const { webrtc } = useVidus();
  const [blur, setBlur] = useState(false);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [enabledArea, setEnabledArea] = useState('modules');
  const modulesAreaRef = useRef(null);
  const usersAreaRef = useRef(null);
  const margin = 10;
  const ratio = 3 / 4;

  const isPortrait = useMemo(() => {
    return window.innerHeight > window.innerWidth;
  }, []);

  const canEnableFaceDetect = useMemo(() => {
    return userSettings.isCreator && webrtc.can('customEmojis');
  }, [userSettings.isCreator, webrtc]);

  useEffect(() => {
    const receivedCanvasAction = (e) => {
      setCanvasEnabled(e.detail.show);
    };

    const receivedScreenShareModuleEvent = (e) => {
      setScreenShareEnabled(e.detail.status);
    };

    document.addEventListener('onCanvasDisplay', receivedCanvasAction);
    document.addEventListener('onScreenShareDisplay', receivedScreenShareModuleEvent);

    return () => {
      document.removeEventListener('onCanvasDisplay', receivedCanvasAction);
      document.removeEventListener('onScreenShareDisplay', receivedScreenShareModuleEvent);
    };
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [connections, canvasEnabled, screenShareEnabled]);

  const resize = () => {
    setTimeout(() => {
      if (isPortrait) {
        if (screenShareEnabled && canvasEnabled) {
          setEnabledArea('modules');
          if (modulesAreaRef.current) modulesAreaRef.current.style.display = 'flex';
          if (usersAreaRef.current) usersAreaRef.current.style.display = 'none';
        } else {
          if (usersAreaRef.current) usersAreaRef.current.style.display = 'flex';
        }
      }

      if (usersAreaRef.current) {
        const width = usersAreaRef.current.offsetWidth - (margin * 2);
        const height = usersAreaRef.current.offsetHeight - (margin * 2);
        const minWidth = window.innerWidth <= 600 ? 240 : 360;
        const maxWidth = window.innerWidth / (window.innerWidth <= 600 ? 1.4 : 2.2);
        const phoneMinWidth = window.innerWidth / 2.6;
        let adjustedMinWidth = (canvasEnabled || screenShareEnabled) ? phoneMinWidth : minWidth;

        let i = 1;
        let max = 0;
        const minWidthWithMargin = adjustedMinWidth + (margin * 2);

        while (i < window.innerWidth) {
          const area = calculateArea(i, width, height);
          if (area === false) {
            max = (i < minWidthWithMargin) ? adjustedMinWidth : i - 1;
            max = (max > maxWidth) ? maxWidth : max;
            break;
          }
          i++;
        }

        resizer(max);
      }
    }, 100);
  };

  const calculateArea = (increment, width, height) => {
    let i = 0;
    let w = 0;
    let h = increment * ratio + (margin * 2);
    const count = usersAreaRef.current?.childElementCount || 0;

    while (i < count) {
      if ((w + increment) > width) {
        w = 0;
        h = h + (increment * ratio) + (margin * 2);
      }
      w = w + increment + (margin * 2);
      i++;
    }

    return (h > height || increment > width) ? false : increment;
  };

  const resizer = (_width) => {
    if (!usersAreaRef.current) return;
    const count = usersAreaRef.current.childElementCount;

    for (let i = 0; i < count; i++) {
      const element = usersAreaRef.current.children[i];
      element.style.margin = margin + 'px';
      element.style.width = _width + 'px';
      element.style.height = (_width * ratio) + 'px';
    }
  };

  const toggleArea = () => {
    if (enabledArea === 'modules') {
      setEnabledArea('users');
      if (modulesAreaRef.current) modulesAreaRef.current.style.display = 'none';
      if (usersAreaRef.current) usersAreaRef.current.style.display = 'flex';
    } else {
      setEnabledArea('modules');
      if (modulesAreaRef.current) modulesAreaRef.current.style.display = 'flex';
      if (usersAreaRef.current) usersAreaRef.current.style.display = 'none';
    }
  };

  const blurUserMediaBackground = (status) => {
    setBlur(status);
    webrtc.Media.blurBackground(status);
  };

  const muteUserMic = (connection) => {
    const action = webrtc.getAction('mute-user-mic');
    action.run(connection);
  };

  const faceDetector = (user, event) => {
    const action = webrtc.getAction('face-api');
    action.run(user, event.target);
  };

  return (
    <div>
      {children.actions}
      <div id="video-meeting">
        <div
          id="video-conference-room"
          className={`${canvasEnabled ? 'with-canvas' : ''} ${screenShareEnabled ? 'with-screen-share' : ''}`}
        >
          {isPortrait && canvasEnabled && screenShareEnabled && (
            <button id="area-switcher" onClick={toggleArea}>
              Switch
            </button>
          )}
          <div id="modules-area" ref={modulesAreaRef}>
            {children.canvas}
            {children.screenShare}
          </div>
          <div id="users-area">
            <div id="video-conference-users" ref={usersAreaRef}>
              <div
                className={`user-item current-user ${userSettings.isCreator ? 'room-creator' : 'room-user'}`}
              >
                {userSettings.micDisable && (
                  <div className="microphone-mute">
                    <Icon icon="microphone-off" />
                  </div>
                )}
                <div className="user-footer-actions">
                  {canEnableFaceDetect && (
                    <div
                      className="action-item face-detector-btn"
                      onClick={(e) => faceDetector(userSettings, e)}
                    >
                      <Icon icon="magic-staff" />
                    </div>
                  )}
                  <div className="action-item" onClick={() => blurUserMediaBackground(!blur)}>
                    {!blur ? <Icon icon="water" /> : <Icon icon="water-off" />}
                  </div>
                </div>
                <div className="user-video">
                  {userSettings.camDisable && (
                    <div className="camera-mute">
                      <p>Camera off</p>
                    </div>
                  )}
                  <video
                    id="video-item"
                    className="video-content video-item"
                    data-peerid={userSettings.peerJsId}
                  />
                </div>
              </div>

              {connections.map((connection, index) => (
                <div
                  key={`connection_${index}`}
                  className={`user-item ${connection.isCreator ? 'room-creator' : 'room-user'}`}
                >
                  <div className="user-name">
                    <span>{connection.name}</span>
                  </div>
                  {connection.micMute && (
                    <div className="microphone-mute">
                      <Icon icon="microphone-off" />
                    </div>
                  )}
                  <div className="user-footer-actions">
                    {canEnableFaceDetect && (
                      <div
                        className="action-item"
                        onClick={(e) => faceDetector(connection, e)}
                      >
                        <Icon icon="magic-staff" />
                      </div>
                    )}
                    {userSettings.isCreator && !connection.micMute && (
                      <div
                        className="action-item microphone-unmute"
                        onClick={() => muteUserMic(connection)}
                      >
                        [mute]
                      </div>
                    )}
                  </div>
                  <div className="user-video">
                    {connection.camMute && (
                      <div className="camera-mute">
                        <p>Camera off</p>
                      </div>
                    )}
                    {connection.active && (
                      <>
                        <video
                          id={`remote-video-${connection.id}`}
                          className={`peer-content video-item peer-content-${connection.id}`}
                          data-peerid={connection.id}
                        />
                        <audio
                          autoPlay
                          id={`remote-audio-${connection.id}`}
                          data-peerid={connection.id}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {children.commandsDeck}
      </div>
      {children.modules}
    </div>
  );
};

export default DefaultTheme;

