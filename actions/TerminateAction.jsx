import React, { useImperativeHandle } from 'react';
import { useVidus } from '../context/VidusContext';

const TerminateAction = React.forwardRef((props, ref) => {
  const { webrtc } = useVidus();

  useImperativeHandle(ref, () => ({
    run: () => {
      const action = webrtc.getAction('terminate');
      action.setAsModeratorAction();
      
      action.request();
    }
  }));

  return null;
});

TerminateAction.displayName = 'TerminateAction';

export default TerminateAction;

