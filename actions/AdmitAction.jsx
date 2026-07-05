import React, { useImperativeHandle } from 'react';
import { useVidus } from '../context/VidusContext';

const AdmitAction = React.forwardRef((props, ref) => {
  const { webrtc } = useVidus();

  useImperativeHandle(ref, () => ({
    run: (room, status, data) => {
      const action = webrtc.getAction('admit');

      action.setAsModeratorAction();
      action.setAttributes({
        status: status,
        roomId: room.id,
        peerJsId: data.peerJsId,
      });
      action.setUsers({
        peerJsId: data.peerJsId,
        status: 'waiting'
      });
      
      action.request();
    }
  }));

  return null;
});

AdmitAction.displayName = 'AdmitAction';

export default AdmitAction;

