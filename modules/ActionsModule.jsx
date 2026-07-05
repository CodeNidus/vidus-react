import React, { useRef, useEffect } from 'react';
import { useVidus } from '../context/VidusContext';
import FaceApiAction from '../actions/FaceApiAction';
import MuteUserMicAction from '../actions/MuteUserMicAction';
import AdmitAction from '../actions/AdmitAction';
import BanAction from '../actions/BanAction';
import TerminateAction from '../actions/TerminateAction';
import './ActionsModule.css';

const VideoConferenceActions = ({ room, userSettings }) => {
  const { webrtc } = useVidus();

  const setAction = (name, object) => {
    webrtc.registerActionReference(name, object);
  }

  // Register custom actions
  const filteredActions = {};

  for (const [key, value] of Object.entries(webrtc.actions)) {
    if (!value?.category?.includes('canvas')) {
      filteredActions[key] = value;
    }
  }

  return (
    <div id="videoConferenceActions">
      <FaceApiAction
        ref={(el) => setAction('face-api', el) }
        room={room}
        userSettings={userSettings}
      />

      <MuteUserMicAction
        ref={(el) => setAction('mute-user-mic', el) }
        room={room}
      />

      <AdmitAction
        ref={(el) => setAction('admit', el) }
      />

      <BanAction
        ref={(el) => setAction('ban', el) }
      />

      <TerminateAction
        ref={(el) => setAction('terminate', el) }
      />

      {Object.entries(filteredActions).map(([key, action], index) => {
        if (!action.view) return null;
        const ActionComponent = action.view;
        return (
          <ActionComponent
            key={key}
            ref={(el) => setAction(key, el)}
            webrtc={webrtc}
            room={room}
            userSettings={userSettings}
          />
        );
      })}
    </div>
  );
};

export default VideoConferenceActions;

