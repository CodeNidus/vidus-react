import React, { useState, useEffect, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import RoomsList from './RoomsList';
import RoomCreate from './RoomCreate';
import './Rooms.css';

const Rooms = ({ onSelectRoom }) => {
  const { webrtc, initialized } = useVidus();
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [waitingDots, setWaitingDots] = useState('.');
  const roomsListRef = useRef(null);

  useEffect(() => {
    const getUserAccessToken = async () => {
      setError(null);
      const interval = setInterval(() => {
        setWaitingDots(prev => {
          if (prev.length < 3) {
            return prev + '.';
          } else {
            return '';
          }
        });
      }, 500);

      try {
        const userToken = await webrtc.getUserToken(false, false);
        setToken(userToken);
      } catch (err) {
        setError(err.message || 'Failed to get access token');
      } finally {
        clearInterval(interval);
      }
    };

    if (initialized) {
      getUserAccessToken();
    }
  }, [initialized, webrtc]);

  const handleRoomCreated = () => {
    if (roomsListRef.current && roomsListRef.current.getRoomsList) {
      roomsListRef.current.getRoomsList();
    }
  };

  const handleRoomSelected = (roomId) => {
    if (onSelectRoom) {
      onSelectRoom(roomId);
    }
  };

  if (!initialized) {
    return (
      <div id="webrtc">
        <div>
          <h2>Initializing...</h2>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div id="webrtc">
        <div className="server-error error">
          {error}
          <div>
            Please <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>try again</a>.
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div id="webrtc">
        <div>
          <h2>Please Wait{waitingDots}</h2>
          <p>Connecting to the server to get a user authorization token.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="webrtc">
      <div id="rooms-section">
        <RoomCreate
          token={token}
          onRoomCreated={handleRoomCreated}
        />
        <RoomsList
          ref={roomsListRef}
          token={token}
          onRoomSelected={handleRoomSelected}
        />
      </div>
    </div>
  );
};

export default Rooms;

