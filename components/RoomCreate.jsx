import React, { useState } from 'react';
import { useVidus } from '../context/VidusContext';
import './RoomCreate.css';

const RoomCreate = ({ token, onRoomCreated }) => {
  const { webrtc } = useVidus();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: null, type: 'success' });
  const [room, setRoom] = useState({
    name: '',
    moderator: 'moderator',
    start_time: '',
    end_time: '',
    expire_time: '',
    authorisable: false,
  });

  React.useEffect(() => {
    const setRoomStartEndTime = () => {
      const setDateTimeFormat = (minutes = 0) => {
        const dateObject = new Date(Date.now());
        dateObject.setDate(dateObject.getDate() + 2);
        dateObject.setMinutes(dateObject.getMinutes() + minutes);
        const dateTime = dateObject.toISOString();
        return dateTime.substring(0, dateTime.indexOf('T') + 6);
      };

      const roomMinTime = setDateTimeFormat();
      setRoom(prev => ({
        ...prev,
        start_time: setDateTimeFormat(1),
        end_time: setDateTimeFormat(10),
        expire_time: setDateTimeFormat(48 * 60),
      }));
    };

    setRoomStartEndTime();
  }, []);

  const handleChange = (field, value) => {
    setRoom(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setMessage({ text: null, type: 'success' });

    if (!room.name || !room.moderator || !room.start_time || !room.end_time || !room.expire_time) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return false;
    }

    setLoading(true);

    try {
      const response = await webrtc.createRoom(room);
      setMessage({
        type: 'success',
        text: 'Room created successfully! Room Id is: ' + response.room.id
      });
      setRoom(prev => ({ ...prev, name: '' }));
      if (onRoomCreated) {
        onRoomCreated(response.room);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error happened! ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const roomMinTime = React.useMemo(() => {
    const dateObject = new Date(Date.now());
    dateObject.setDate(dateObject.getDate() + 2);
    const dateTime = dateObject.toISOString();
    return dateTime.substring(0, dateTime.indexOf('T') + 6);
  }, []);

  return (
    <div id="room-register" className="card">
      <h2>Create Room</h2>
      <form onSubmit={createRoom}>
        <div className="text-field">
          <label>Room Name</label>
          <input
            type="text"
            value={room.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div className="text-field">
          <label>Moderator</label>
          <input
            type="text"
            value={room.moderator}
            onChange={(e) => handleChange('moderator', e.target.value)}
          />
        </div>
        <div className="text-field">
          <label>Start Time</label>
          <input
            type="datetime-local"
            value={room.start_time}
            min={roomMinTime}
            onChange={(e) => handleChange('start_time', e.target.value)}
          />
        </div>
        <div className="text-field">
          <label>End Time</label>
          <input
            type="datetime-local"
            value={room.end_time}
            min={room.start_time}
            onChange={(e) => handleChange('end_time', e.target.value)}
          />
        </div>
        <div className="text-field">
          <label>Expire Time</label>
          <input
            type="datetime-local"
            value={room.expire_time}
            min={room.end_time}
            onChange={(e) => handleChange('expire_time', e.target.value)}
          />
        </div>
        <div>
          <label className="text-bold">Authorisable</label>
          <label className="switch mx-2">
            <input
              type="checkbox"
              checked={room.authorisable}
              onChange={(e) => handleChange('authorisable', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        <div>
          {!loading ? (
            <input type="submit" className="btn btn-block" value="Create Room" />
          ) : (
            <span>Please wait ...</span>
          )}
        </div>
      </form>

      {message.text && (
        <div className={message.type}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default RoomCreate;

