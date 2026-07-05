import React, { useState, useEffect, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import './RecordScreenModule.css';

const RecordScreenModule = React.forwardRef(({ webrtc: webrtcProp, setUserSettings }, ref) => {
  const { webrtc: webrtcContext } = useVidus();
  const webrtc = webrtcProp || webrtcContext;
  const [isVisible, setIsVisible] = useState(false);
  const recordingTextRef = useRef(null);

  useEffect(() => {
    const screenRecordModuleAction = (event) => {
      setIsVisible(event.detail?.status || false);

      if (event.detail?.status && recordingTextRef.current) {
        setTimeout(() => {
          if (recordingTextRef.current) {
            recordingTextRef.current.classList.remove('hide');
          }
        }, 100);

        setTimeout(() => {
          if (recordingTextRef.current) {
            recordingTextRef.current.classList.add('hide');
          }
        }, 5000);
      }
    };

    document.addEventListener('onScreenRecordStateChange', screenRecordModuleAction);

    if (webrtc.Media.screenRecord.isRecordingScreen()) {
      setIsVisible(true);
    }

    return () => {
      document.removeEventListener('onScreenRecordStateChange', screenRecordModuleAction);
    };
  }, [webrtc]);

  const open = async (room) => {
    if (!webrtc.userSettings.record) {
      if (!webrtc.userSettings.isCreator) {
        webrtc.notify('Screen Record', 'Only room creator can record meeting.');
        return;
      }
      webrtc.Media.screenRecord.startRecord();
      setUserSettings(prev => ({
        ...prev,
        record: true,
      }));
    } else {
      webrtc.Media.screenRecord.stopRecord();
      setUserSettings(prev => ({
        ...prev,
        record: false,
      }));
    }
  };

  React.useImperativeHandle(ref, () => ({ open }));

  if (!isVisible) return null;

  return (
    <div id="recording-screen">
      <div id="screen-record-control">
        <div className="recording-icon"></div>
        <div className="recording-text hide" ref={recordingTextRef}>Recording</div>
      </div>
    </div>
  );
});

RecordScreenModule.displayName = 'RecordScreenModule';

export default RecordScreenModule;

