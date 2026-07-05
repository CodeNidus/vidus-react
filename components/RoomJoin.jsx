import React, { useState, useEffect, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import VideoConference from './VideoConference';
import './RoomJoin.css';
import Icon from '../helpers/Icon';

const RoomJoin = ({ roomId, onCloseConference }) => {
  const { webrtc, initialized } = useVidus();
  const [token, setToken] = useState(null);
  const [name, setName] = useState('');
  const [camDisable, setCamDisable] = useState(false);
  const [micDisable, setMicDisable] = useState(false);
  const [resolution, setResolution] = useState('qvga');
  const [waiting, setWaiting] = useState(false);
  const [startConnecting, setStartConnecting] = useState(false);
  const [roomIsValid, setRoomIsValid] = useState(true);
  const [socketFailed, setSocketFailed] = useState(false);
  const [peerJsFailed, setPeerJsFailed] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [permissionsState, setPermissionsState] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [cameraDevice, setCameraDevice] = useState(null);
  const [microphoneDevice, setMicrophoneDevice] = useState(null);
  const [speakerDevice, setSpeakerDevice] = useState(null);
  const [speakerEnable, setSpeakerEnable] = useState(false);
  const [initializeVideo, setInitializeVideo] = useState(false);
  const [prepearInitializing, setPrepearInitializing] = useState(false);
  const [message, setMessage] = useState(null);
  const conferenceRef = useRef(null);

  useEffect(() => {
    if (initialized) {
      const getToken = async () => {
        try {
          const userToken = await webrtc.getUserToken(false);
          setToken(userToken);
        } catch (error) {
          console.error('Failed to get token:', error);
        }
      };

      getToken();
      grantPermissions();
    }
  }, [initialized, webrtc]);

  useEffect(() => {
    if (cameras.length > 0 && !cameraDevice) {
      setCameraDevice(cameras[0].deviceId);
    }
  }, [cameras, cameraDevice]);

  useEffect(() => {
    if (microphones.length > 0 && !microphoneDevice) {
      setMicrophoneDevice(microphones[0].deviceId);
    }
  }, [microphones, microphoneDevice]);

  useEffect(() => {
    if (speakers.length > 0 && !speakerDevice) {
      setSpeakerDevice(speakers[0].deviceId);
    }
  }, [speakers, speakerDevice]);

  const grantPermissions = async () => {
    try {
      const state = await webrtc.Media.grantPermissions();
      setPermissionsState(state);
      setCameras(state.getCameras());
      setMicrophones(state.getMicrophones());
      setSpeakers(state.getSpeakers());
    } catch (error) {
      console.error('Failed to grant permissions:', error);
    }
  };

  const joinToRoom = () => {
    if (!name) return;
    setStartConnecting(true);
    setPrepearInitializing(true);
    
    setTimeout(() => {
      if (conferenceRef.current && conferenceRef.current.initialize) {
        const room = { id: roomId };
        conferenceRef.current.initialize(room, token);
      }
    }, 100);
  };

  const closeConference = () => {
    setInitializeVideo(false);
    setPrepearInitializing(false);
    setName('');
    setCamDisable(false);
    setMicDisable(false);
    setResolution('qvga');
    setWaiting(false);
    setStartConnecting(false);
    setRoomIsValid(true);
    setSocketFailed(false);
    setPeerJsFailed(false);
    setConnectionFailed(false);

    if (onCloseConference) {
      onCloseConference();
    }
  };

  const connectionInitialed = () => {
    setConnectionFailed(false);
    setInitializeVideo(true);
  }

  const authorizeRoomInvalid = (error) => {
    setErrorMessage(error);
    setRoomIsValid(false);
  }

  const socketConnectionFailed = () => {
    setConnectionFailed(true);
    setSocketFailed(true);
  }

  const peerJsConnectionFailed = () => {
    setConnectionFailed(true);
    setPeerJsFailed(true);
  }

  const setWaitingStatus = (status) => {
    setWaiting(status);
  }

  const setCustomMessage = (message) => {
    setMessage(message);
  }

  

  if (!initialized) {
    return (
      <div className="webrtc-section">
        <div className="video-installation">
          <div id="room-join" className="card">
            <div>Initializing...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="webrtc-section">
      <div className="video-installation" style={{ display: initializeVideo ? 'none' : 'block' }}>
        <div id="room-join" className="card">
          {!token ? (
            <div>Please wait, connecting...</div>
          ) : !startConnecting ? (
            <div className="connection-settings">
              {permissionsState?.handleDenied ? (
                <>
                  {!permissionsState.camera && !permissionsState.microphone ? (
                    <div>
                      <p>
                        Click on button to grant camera & microphone permissions.<br />
                        Please click on <strong>Allow</strong> button to grant access permissions.
                      </p>
                      <button className="btn" onClick={grantPermissions}>
                        Request Permissions
                      </button>
                    </div>
                  ) : (
                    <div className="introduction">
                      <div className="introduction-title">
                        Please restart your browser camera and microphone permissions.
                      </div>
                      <p className="introduction-text">
                        To reset camera and microphone permissions:<br /><br />
                        1. Click the lock or information icon in the address bar.<br />
                        2. Go to "Site settings" or "Permissions".<br />
                        3. Reset the camera and microphone permissions.<br />
                        4. Refresh this page and grant access when prompted.<br />
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="d-flex info">
                    <div className="text-field">
                      <label>Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn-join mx-2"
                      disabled={!name || permissionsState?.camera || permissionsState?.microphone}
                      onClick={joinToRoom}
                    >
                      Join
                    </button>
                  </div>

                  <div className="device-setting">
                    <button
                      className={`d-flex btn-small ${camDisable ? 'disabled' : ''}`}
                      onClick={() => setCamDisable(!camDisable)}
                    >
                      {camDisable ? (
                        <Icon icon='video-off' />
                      ) : (
                        <Icon icon='video' />
                      )}
                    </button>
                    <button
                      className={`d-flex btn-small ${micDisable ? 'disabled' : ''}`}
                      onClick={() => setMicDisable(!micDisable)}
                    >
                      {micDisable ? (
                        <Icon icon='microphone-off' />
                      ) : (
                        <Icon icon='microphone' />
                      )}
                    </button>
                    <div className="select-field">
                      <label>Resolution</label>
                      <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                        <option value="qvga">QVGA</option>
                        <option value="vga">VGA</option>
                        <option value="hd">HD</option>
                        <option value="fhd">Full HD</option>
                      </select>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="devices">
                    <div className="select-field">
                      <label>Camera</label>
                      <select
                        value={cameraDevice || ''}
                        onChange={(e) => setCameraDevice(e.target.value)}
                      >
                        {cameras.map((camera, index) => (
                          <option key={`camera_device_${index}`} value={camera.deviceId}>
                            {camera.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="select-field">
                      <label>Microphone</label>
                      <select
                        value={microphoneDevice || ''}
                        onChange={(e) => setMicrophoneDevice(e.target.value)}
                      >
                        {microphones.map((microphone, index) => (
                          <option key={`microphone_device_${index}`} value={microphone.deviceId}>
                            {microphone.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {speakerEnable && speakers.length > 0 && (
                      <div className="select-field">
                        <label>Speaker</label>
                        <select
                          value={speakerDevice || ''}
                          onChange={(e) => setSpeakerDevice(e.target.value)}
                        >
                          {speakers.map((speaker, index) => (
                            <option key={`speaker_device_${index}`} value={speaker.deviceId}>
                              {speaker.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {roomIsValid && !connectionFailed ? (
                <p>{!waiting ? 'Please wait for establishing a connection...' : 'Please wait until host admit you to join room...'}</p>
              ) : (
                <div className="error">
                  {roomIsValid ? (
                    <>
                      {socketFailed ? (
                        <p>Sorry! apparently server doesn't respond, please contact with administration.</p>
                      ) : peerJsFailed ? (
                        <p>Sorry! apparently server doesn't respond, please contact with administration.</p>
                      ) : (
                        <p>Sorry! apparently server doesn't respond, please try again.</p>
                      )}
                    </>
                  ) : (
                    <p>{errorMessage || 'The desired room was not found! Please try to connect to an available room.'}</p>
                  )}
                  <a href="#" onClick={(e) => { e.preventDefault(); closeConference(); }} className="mx-2">
                    Back
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {prepearInitializing && (
        <VideoConference
          ref={conferenceRef}
          name={name}
          devices={{
            camera: cameraDevice,
            microphone: microphoneDevice,
            speaker: speakerDevice,
            resolution: resolution
          }}
          camDisable={camDisable}
          micDisable={micDisable}
          waiting={waiting}
          onConnectionInitialed={connectionInitialed}
          onAuthorizeRoomInvalid={authorizeRoomInvalid}
          onSocketConnectionFailed={socketConnectionFailed}
          onPeerJsConnectionFailed={peerJsConnectionFailed}
          onCloseConference={closeConference}
          onSetWaitingStatus={setWaitingStatus}
          onSetCustomMessage={setCustomMessage}
        />
      )}
    </div>
  );
};

export default RoomJoin;

