import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useVidus } from '../context/VidusContext';
import './RoomsList.css';
import Icon from '../helpers/Icon';

const RoomsList = forwardRef(({ token, onRoomSelected }, ref) => {
  const { webrtc } = useVidus();
  const [loading, setLoading] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [rooms, setRooms] = useState([]);

  const canShare = typeof navigator !== 'undefined' && navigator.share;

  const getRoomsList = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await webrtc.getRoomsList();
      setRooms(response.rooms || []);
      setShowRooms(true);
    } catch (error) {
      if (webrtc.configs.debug) {
        console.error('Failed to get rooms list:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectRoom = (roomId) => {
    if (onRoomSelected) {
      onRoomSelected(roomId);
    }
  };

  const copyToClipboard = async (room, e) => {
    e.stopPropagation();
    const baseurl = window.location.origin + window.location.pathname;
    const roomPath = baseurl + '?room_id=' + room._id;

    try {
      setRooms(prevRooms =>
          prevRooms.map(r =>
              r._id === room._id
                  ? { ...r, clipboard: true }
                  : r
          )
      );

      await navigator.clipboard.writeText(roomPath);
      setTimeout(() => {
        setRooms(prevRooms =>
            prevRooms.map(r =>
                r._id === room._id
                    ? { ...r, clipboard: false }
                    : r
            )
        );
      }, 2000);
      webrtc.notify('Copy Room Link', 'Copied successfully');
    } catch (error) {
      if (webrtc.configs.debug) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const shareRoom = async (room, e) => {
    e.stopPropagation();
    const baseurl = window.location.origin + window.location.pathname;
    const roomPath = baseurl + '?room_id=' + room._id;

    try {
      await navigator.share({
        url: roomPath,
        text: 'Join to Vidus video conference room.',
        title: 'Join Now To Room!'
      });
      webrtc.notify('Share Room Link', 'Shared successfully');
    } catch (error) {
      if (webrtc.configs.debug) {
        console.error('Error sharing:', error);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    getRoomsList
  }));

  return (
    <div id="rooms-list" className="card">
      <h2>Rooms List</h2>
      <div className="rooms-list-table">
        <button
          className="btn btn-small"
          disabled={loading}
          onClick={getRoomsList}
        >
          {loading ? 'Please Wait ...' : 'Get Rooms List'}
        </button>
        <div>
          {showRooms && !loading && (
            <table>
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Room ID</th>
                  <th>Start Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rooms.length > 0 ? (
                  rooms.map((room, index) => (
                    <tr
                      key={`room_${index}`}
                      onClick={() => selectRoom(room._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{room.name}</td>
                      <td>{room._id}</td>
                      <td>{room.start_time?.split('T')[0]}</td>
                      <td className="share-room">
                        <a
                            className="btn btn-small mx-2"
                            onClick={(e) =>  copyToClipboard(room, e)}
                            disabled={room?.clipboard}
                        >
                          {room?.clipboard ? (
                              <Icon icon="clipboard-check-outline" />
                          ) : (
                              <Icon icon="clipboard-outline" />
                          )}
                        </a>
                        {canShare && (
                          <a
                            className="btn btn-small mx-2"
                            onClick={(e) => shareRoom(room, e)}
                          >
                            <Icon icon='share-variant-outline' />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">Nothing found!</td>
                  </tr>
                )}
              </tbody>
              {rooms.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="4">Select desired room to join.</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
});

RoomsList.displayName = 'RoomsList';

export default RoomsList;

