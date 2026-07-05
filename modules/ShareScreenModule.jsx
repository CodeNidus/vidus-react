import React, { useState, useEffect, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import Icon from '../helpers/Icon';
import './ShareScreenModule.css';

const ShareScreenModule = React.forwardRef(({ webrtc: webrtcProp }, ref) => {
  const { webrtc: webrtcContext } = useVidus();
  const webrtc = webrtcProp || webrtcContext;
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef(null);

  const attachStream = () => {
    const video = videoRef.current;
    if (!video) return;

    if (webrtc.userSettings.share && webrtc.userSettings.shareMedia) {
      video.muted = true;
      video.srcObject = webrtc.userSettings.shareMedia;
      video.play().catch(() => {});
      return;
    }

    const sharingConnection = webrtc.People.findOne('share', true);
    const stream = sharingConnection?.shareMediaConnection?.remoteStream;
    if (stream) {
      video.muted = false;
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  };

  useEffect(() => {
    const shareScreenDisplayToggle = (event) => {
      setIsVisible(event.detail?.status || false);
    };

    document.addEventListener('onScreenShareDisplay', shareScreenDisplayToggle);
    shareScreenDisplayToggle({ detail: { status: false } });

    return () => {
      document.removeEventListener('onScreenShareDisplay', shareScreenDisplayToggle);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      attachStream();
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isVisible]);

  const open = async (room) => {
    if (!webrtc.userSettings.share) {
      const shareStatus = webrtc.People.findOne('share', true);
      if (shareStatus) {
        webrtc.notify('Screen Share', 'Some one use this feature now.');
        return;
      }
      webrtc.Media.screenShare.startShareScreen();
    } else {
      webrtc.Media.screenShare.stopShareScreen();
    }
  };

  const fullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  React.useImperativeHandle(ref, () => ({ open, fullscreen }));

  return (
    <div id="screen-sharing" className={isVisible ? '' : 'screen-sharing-hidden'}>
      <div id="screen-sharing-area">
        <div className="screen-share-full-screen" onClick={fullscreen}>
          <Icon width="48" height="48" icon="fullscreen" />
          <div className="screen-share-full-screen-background"></div>
        </div>
        <video
          ref={videoRef}
          id="screen-sharing-video"
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
});

ShareScreenModule.displayName = 'ShareScreenModule';

export default ShareScreenModule;

