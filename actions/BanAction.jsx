import React, { useImperativeHandle } from 'react';
import { useVidus } from '../context/VidusContext';

const BanAction = React.forwardRef((props, ref) => {
  const { webrtc } = useVidus();

  useImperativeHandle(ref, () => ({
    run: (data) => {
      const action = webrtc.getAction('ban');

      action.setAsModeratorAction();
      action.setAttributes({
        ban: {
          name: data.name,
          peerJsId: data.peerJsId
        }
      });

      action.request();
    }
  }));

  return null;
});

BanAction.displayName = 'BanAction';

export default BanAction;

