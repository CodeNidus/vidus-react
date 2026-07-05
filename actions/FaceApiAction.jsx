import React, { useState, useEffect, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import { createPortal } from 'react-dom';
import './FaceApiAction.css';

const FaceApiAction = React.forwardRef(({ room, userSettings }, ref) => {
  const { webrtc } = useVidus();
  const [usersSetting, setUsersSetting] = useState({});

  useEffect(() => {
    const closePopup = (event) => {
      const parent = event.target.closest('div');
      if (event.target?.classList.contains('face-api-action-popup') ||
        parent?.classList.contains('face-api-action-popup')) return;

      setUsersSetting(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(peerJsId => {
          updated[peerJsId] = { ...updated[peerJsId], showPopup: false };
        });
        return updated;
      });
    };

    document.addEventListener('click', closePopup);
    return () => document.removeEventListener('click', closePopup);
  }, []);

  useEffect(() => {
    const userFaceApiListenerAction = (e) => {
      webrtc.helpers.faceApiAction.setStatus(e);
    };

    document.addEventListener('onFaceDetectDraw', userFaceApiListenerAction);
    if (room?.id) {
      webrtc.helpers.faceApiAction.getImagesFromBucket(room.id);
    }

    return () => {
      document.removeEventListener('onFaceDetectDraw', userFaceApiListenerAction);
    };
  }, [room, webrtc]);

  const setEmoji = (type, peerJsId) => {
    setUsersSetting(prev => {
      const updated = { ...prev };

      if (updated[peerJsId]) {
        updated[peerJsId] = {
          ...updated[peerJsId],
          [type]: !updated[peerJsId][type],
          showPopup: false
        };

        startDraw(updated[peerJsId][type], type, peerJsId);
      }

      return updated;
    });
  };

  const startDraw = (status, type, peerJsId) => {
    const action = webrtc.getAction('face-api');
    
    action.setAttributes({
      type: type,
      status: status,
    });
    action.setUsers({
      peerJsId: peerJsId
    });
    action.setAsModeratorAction();
    
    action.request();
  };

  const run = (user, target) => {
    const userItem = target.closest('.user-item');
    if (!userItem) return;

    setUsersSetting(prev => {
      if (!prev[user.peerJsId]) {
        prev[user.peerJsId] = {
          showPopup: false,
          hat: false,
          medal: false,
          target: userItem,
        };
      } else {
        prev[user.peerJsId] = {
          ...prev[user.peerJsId],
          target: userItem
        };
      }
      return { ...prev };
    });

    setTimeout(() => {
      setUsersSetting(prev => ({
        ...prev,
        [user.peerJsId]: { ...prev[user.peerJsId], showPopup: true }
      }));
    }, 10);
  };

  React.useImperativeHandle(ref, () => ({ run }));

  return (
    <>
      {Object.entries(usersSetting).map(([peerJsId, setting]) => {
        if (!setting.target || !setting.showPopup) return null;

        return createPortal(
          <div className="face-api-action-popup">
            <span
              className={`emoji-type ${setting.medal ? 'selected' : ''}`}
              onClick={() => setEmoji('medal', peerJsId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 1800 1800">
                <g>
                  <path d="M1170.537,1120.229l-178.391-25.926l-79.759-161.635c-5.272-10.681-16.147-17.441-28.059-17.441
                    c-11.906,0-22.783,6.761-28.056,17.441l-79.776,161.63l-178.386,25.931c-11.785,1.711-21.574,9.964-25.253,21.29
                    c-3.68,11.326-0.611,23.761,7.917,32.071l129.084,125.823l-30.474,177.653c-2.013,11.736,2.811,23.6,12.447,30.601
                    c9.633,6.991,22.404,7.926,32.944,2.383l159.553-83.88l159.547,83.88c4.573,2.404,9.575,3.592,14.552,3.592
                    c6.494,0,12.945-2.017,18.393-5.975c9.637-7.001,14.464-18.864,12.447-30.601l-30.465-177.657l129.07-125.819
                    c8.529-8.314,11.593-20.745,7.918-32.071C1192.107,1130.192,1182.321,1121.939,1170.537,1120.229z"/>
                  <path d="M1784.612,23.339c-5.569-9.776-15.948-15.813-27.191-15.813h-462.282c-11.183,0-21.51,5.966-27.096,15.652
                    L913.897,637.144c-9.349-0.476-18.752-0.711-28.211-0.733L531.961,23.178c-5.587-9.686-15.918-15.652-27.1-15.652H42.58
                    c-11.247,0-21.626,6.037-27.191,15.813c-5.561,9.772-5.451,21.779,0.292,31.451l451.452,759.959
                    c-99.576,103.891-160.847,244.763-160.847,399.686c0,318.734,259.309,578.041,578.039,578.041
                    c318.728,0,578.03-259.307,578.03-578.041c0-144.814-53.537-277.354-141.842-378.884L1784.315,54.79
                    C1790.06,45.118,1790.173,33.111,1784.612,23.339z"/>
                </g>
              </svg>
            </span>
            <span
              className={`emoji-type ${setting.hat ? 'selected' : ''}`}
              onClick={() => setEmoji('hat', peerJsId)}
            >
              <svg height="36px" width="36px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 413.988 413.988">
                <path d="M333.598,231.344c-4.083-34.865-14.409-95.779-38.456-124.271c-7.853-11.084-29.643-28.275-56.985-15.232
                  c-3.548,1.691-7.011,3.881-10.359,5.998c-7.001,4.426-13.614,8.607-20.804,8.607c-7.19,0-13.805-4.182-20.807-8.607
                  c-3.349-2.117-6.812-4.307-10.359-5.998c-27.341-13.045-49.133,4.15-56.984,15.232c-24.046,28.494-34.373,89.41-38.456,124.275
                  c-2.562,0.482-5.08,0.98-7.516,1.488C39.628,239.762,0,252.497,0,273.835c0,19.697,34.263,31.973,63.006,38.803
                  c38.519,9.152,89.654,14.193,143.987,14.193c54.332,0,105.468-5.041,143.987-14.193c28.744-6.83,63.008-19.105,63.008-38.803
                  C413.988,251.426,371.136,238.43,333.598,231.344z"/>
              </svg>
            </span>
          </div>,
          setting.target
        );
      })}
    </>
  );
});

FaceApiAction.displayName = 'FaceApiAction';

export default FaceApiAction;

