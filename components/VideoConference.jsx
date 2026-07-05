import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import { useVidus } from '../context/VidusContext';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter';
import ActionsModule from '../modules/ActionsModule';
import ChatModule from '../modules/ChatModule';
import PeopleModule from '../modules/PeopleModule';
import CanvasModule from '../modules/CanvasModule';
import ShareScreenModule from '../modules/ShareScreenModule';
import RecordScreenModule from '../modules/RecordScreenModule';
import CommandsDeckModule from '../modules/CommandsDeckModule';
import '../assets/css/DefaultThemeStyle.css';
import './VideoConference.css';

import { createProxyArray, createProxyObject } from '../helpers/Proxy';

const VideoConference = React.forwardRef(({
  name,
  devices,
  camDisable,
  micDisable,
  onSocketConnectionFailed,
  onPeerJsConnectionFailed,
  onCloseConference,
  onAuthorizeRoomInvalid,
  onSetWaitingStatus,
  onConnectionInitialed,
  onSetCustomMessage,
}, ref) => {
  const { webrtc, initialized } = useVidus();
  const [room, setRoom] = useState();
  const roomRef = useRef();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [roomIsValid, setRoomIsValid] = useState(true);

  /*const [userSettings, setUserSettings] = useState({
    isCreator: false,
    share: false,
  });/*/
  const [ThemeLayout, setThemeLayout] = useState(null);
  const modulesRef = useRef({});
  const eventsRef = useRef(new Map());

  const [connections, setConnections] = useState([]);
  const [userSettings, setUserSettings] = useState({});
  const [waitingList, setWaitingList] = useState([]);

  const connectionsProxyRef = useRef(null);
  const userSettingsProxyRef = useRef(null);
  const waitingListProxyRef = useRef(null);


  useEffect(() => {
    const connectionsArray = createProxyArray((newArray) => {
      setConnections(newArray);
    });

    const waitingListArray = createProxyArray((newArray) => {
      setWaitingList(newArray);
    });

    const userSettingsObject = createProxyObject((newObject) => {
      setUserSettings(newObject);
    });

    connectionsProxyRef.current = connectionsArray;
    waitingListProxyRef.current = waitingListArray;
    userSettingsProxyRef.current = userSettingsObject;

    loadTheme();
    setupListeners();

    return () => {
      removeListeners();
    };

  }, []);

  const loadTheme = async () => {
    const theme = webrtc.configs.theme || 'default';
    const themeName = theme.toLowerCase().charAt(0).toUpperCase() + theme.slice(1);

    let ThemeComponent = null;

    if (webrtc.themes && webrtc.themes[theme]) {
      ThemeComponent = webrtc.themes[theme];
    } else {
      try {
        ThemeComponent = await loadThemeLayout(themeName);
      } catch (error) {
        ThemeComponent = await loadThemeLayout('Default');
      }
    }

    setThemeLayout(() => ThemeComponent.default);
    setThemeReady(true);
  };

  const loadThemeLayout = async (name) => {
    let layout = async () => import('../themes/' + name + 'Theme.jsx');
    return await layout();
  }

  const setupListeners = () => {
    const eventHandlers = {
      'onRoomAdmitWait': eventHandlerWaitUntilHostAdmit,
      'onRoomJoined': eventHandlerConnectToRoomSuccess,
      'onPeerJsConnectionFailed': eventHandlerPeerJsConnectionFailed,
      'onRoomInvalid': invalidRoom,
      'onTerminateConference': leftTheRoom,
      'onMediaStreamReset': eventHandlerUpdateConnections,
    };

    if (webrtc.isMobileDevice()) {
      eventHandlers['visibilitychange'] = checkBrowserWindowVisibility;
    }

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      document.addEventListener(eventName, handler);
      eventsRef.current.set(eventName, handler);
    });
  };

  const removeListeners = () => {
    eventsRef.current.forEach((handler, eventName) => {
      document.removeEventListener(eventName, handler);
    });

    eventsRef.current.clear();
  };

  const initialize = async (roomItem = null, tokenItem = null) => {

    setRoom(roomItem);
    setToken(tokenItem);
    setLoading(true);
    setIsReady(false);
    setRoomIsValid(true);
    setConnections([]);
    setWaitingList([]);

    const connectionsArray = connectionsProxyRef.current;
    const waitingListArray = waitingListProxyRef.current;
    const userSettingsObject = userSettingsProxyRef.current;

    roomRef.current = roomItem;

    if (!tokenItem) {
      onSetCustomMessage('Connection is not established with server.');
      return;
    }

    if (!roomItem || !roomItem.id) {
      onSetCustomMessage('Please set the room id for joining.');
      return;
    }

    userSettingsObject.isCreator = false;
    userSettingsObject.share = false;
    userSettingsObject.camDisable = camDisable;
    userSettingsObject.micDisable = micDisable;


    webrtc.setup({
      options: {
        name: name,
        roomId: roomItem.id,
        localVideoRef: 'video-item',
        remoteVideoRef: 'remote-video',
        remoteAudioRef: 'remote-audio',
        resolution: devices.resolution
      },
      connections: connectionsArray,
      waitingList: waitingListArray,
      userSettings: userSettingsObject,
    });

    try {
      await webrtc.openConnection(tokenItem)

      webrtc.initialPeerJs(tokenItem).then(async (peerJsId) => {
        webrtc.Room.join(roomItem.id, {
          name: name
        });
      }).catch((error) => {
        if (onPeerJsConnectionFailed) {
          onPeerJsConnectionFailed();
        }
      });
    } catch (error) {
      if (onSocketConnectionFailed) {
        onSocketConnectionFailed();
      }
    }
  };

  const leftTheRoom = async () => {
    const data = {
      username: name,
    };

    webrtc.Room.left(data).then(() => {
      if (onCloseConference) {
        onCloseConference();
      }
    });
  };

  const invalidRoom = (error) => {
    setRoomIsValid(false);
    if (onAuthorizeRoomInvalid) {
      onAuthorizeRoomInvalid(error.detail);
    }
  };

  const openModule = (name) => {
    if (modulesRef.current[name] && modulesRef.current[name].open) {
      modulesRef.current[name].open(room);
    }
  };

  const eventHandlerConnectToRoomSuccess = (data) => {
    setLoading(false);
    setIsReady(true);

    if (onSetWaitingStatus) {
      onSetWaitingStatus(true);
    }
    if (onConnectionInitialed) {
      onConnectionInitialed(data.detail);
    }

    if (data.detail.waitList && data.detail.waitList.length > 0) {
      setWaitingList(data.detail.waitList);
    }

    setTimeout(async () => {
      await webrtc.startStreamUserMedia(devices);
      webrtc.Room.notifyJoinSuccess(roomRef.current.id);
    }, 100);
  };

  const eventHandlerWaitUntilHostAdmit = () => {
    if (onSetWaitingStatus) {
      onSetWaitingStatus(true);
    }
  };

  const eventHandlerPeerJsConnectionFailed = () => {
    if (onPeerJsConnectionFailed) {
      onPeerJsConnectionFailed();
    }
  };

  const eventHandlerUpdateConnections = (data) => {
    setConnections([...connectionsProxyRef.current]);
  }

  const checkBrowserWindowVisibility = () => {
    if (document.visibilityState === 'hidden') {
      webrtc.Media.sendUserMediaMuteStatusByDataConnection(true, true);
    } else {
      webrtc.Media.sendUserMediaMuteStatusByDataConnection(
        userSettings.camDisable,
        userSettings.micDisable
      );
    }
  };

  useImperativeHandle(ref, () => ({
    initialize
  }));

  if (!initialized || !themeReady || !isReady) {
    return;
  }

  if (!roomIsValid) {
    onSetCustomMessage('Invalid room.');
    return;
  }

  if (!ThemeLayout) {
    onSetCustomMessage('Loading theme...');
    return;
  }

  const themeChildren = {
    modules: (
      <>
        <ChatModule
          ref={(obj) => { modulesRef.current['chat'] = obj; }}
          webrtc={webrtc}
        />
        <PeopleModule
          ref={(obj) => { modulesRef.current['people'] = obj; }}
          webrtc={webrtc}
          waitingList={waitingList}
        />
        <RecordScreenModule
          ref={(obj) => { modulesRef.current['record'] = obj; }}
          webrtc={webrtc}
          setUserSettings={setUserSettings}
        />
      </>
    ),
    canvas: webrtc.configs.development?.canvas?.enable ? (
      <CanvasModule
        ref={(obj) => { modulesRef.current['canvas'] = obj; }}
        room={room}
        webrtc={webrtc}
      />
    ) : null,
    screenShare: (
      <ShareScreenModule
        ref={(obj) => { modulesRef.current['screen'] = obj; }}
        webrtc={webrtc}
      />
    ),
    actions: (
      <ActionsModule
        room={room}
        webrtc={webrtc}
        connections={connections}
        userSettings={userSettings}
      />
    ),
    commandsDeck: (
      <CommandsDeckModule
        userSettings={userSettings}
        setUserSettings={setUserSettings}
        onOpenModule={openModule}
        onRoomLeft={leftTheRoom}
      />
    )
  };

  return (
    <div id="video-conference">
      <ThemeLayout connections={connections} userSettings={userSettings} children={themeChildren} />
    </div>
  );
});

VideoConference.displayName = 'VideoConference';

export default VideoConference;

