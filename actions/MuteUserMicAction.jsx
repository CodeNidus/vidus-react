import React, { useImperativeHandle } from 'react';
import { useVidus } from '../context/VidusContext';

const MuteUserMicAction = React.forwardRef((props, ref) => {
  const { webrtc } = useVidus();

  useImperativeHandle(ref, () => ({
    run: (data) => {
      const action = webrtc.getAction('mute-user-mic');

      action.setAsModeratorAction();
      action.setUsers({
        name: data.name,
        peerJsId: data.peerJsId
      });

      action.request();
    }
  }));

  return null;
});

MuteUserMicAction.displayName = 'MuteUserMicAction';

export default MuteUserMicAction;

