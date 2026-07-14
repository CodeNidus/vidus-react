import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVidus } from '../context/VidusContext';
import Sidebar from '../helpers/Sidebar';
import beepAudio from '../assets/audio/beep.mp3';
import EmojiPicker from 'emoji-picker-react';
import './ChatModule.css';

const ChatModule = React.forwardRef(({ webrtc: webrtcProp, connections, setUserSettings }, ref) => {
  const { webrtc: webrtcContext } = useVidus();
  const webrtc = webrtcProp || webrtcContext;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [room, setRoom] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesBoxRef = useRef(null);
  const emojiesBoxRef = useRef(null);
  const audioRef = useRef(null);

  const users = useMemo(() => {
    const userList = [{
      name: 'Everyone',
      peerJsId: null
    }];

    webrtc.People.getConnections().forEach((item) => {
      userList.push({
        name: item.name,
        peerJsId: item.peerJsId
      });
    });

    return userList;
  }, [webrtc, connections]);

  useEffect(() => {
    const receivedMessageAction = (e) => {
      let user = users.find(x => x.peerJsId === e.detail.sender);

      if (!user) {
        if (e.detail.sender === webrtc.peerJsId) {
          return;
        }

        user = { name: 'unknown' };
      }

      insertMessage(user.name, e.detail.message, e.detail.private);

      if (audioRef.current) {
        audioRef.current.play();
      }

      if (!isOpen) {
        setUserSettings(prev => ({
          ...prev,
          newMessage: true,
        }));
      }
    };

    const handleEmojiesBox = (event) => {
      if (!event.target.closest('.emojies-box') && 
          !event.target.classList.contains('emojies-toggler')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('onChatMessageReceived', receivedMessageAction);
    document.addEventListener('click', handleEmojiesBox);
    audioRef.current = new Audio(beepAudio);

    return () => {
      document.removeEventListener('onChatMessageReceived', receivedMessageAction);
      document.removeEventListener('click', handleEmojiesBox);
    };
  }, [webrtc, users, isOpen]);

  useEffect(() => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const index = users.findIndex(x => x.peerJsId === selectedUser);
    if (index < 0) {
      setSelectedUser(null);
    }
  }, [users, selectedUser]);

  const getCurrentTime = () => {
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return hours + ':' + minutes + ' ' + ampm;
  };

  const insertMessage = (name, message, privateType = false) => {
    setMessages(prev => [...prev, {
      from: name,
      text: message,
      time: getCurrentTime(),
      private: privateType
    }]);
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    const action = webrtc.getAction('chat');

    action.setAttributes({
      message: text,
      sender: webrtc.peerJsId,
      private: !!selectedUser,
    });

    if (selectedUser) {
      action.setUsers(selectedUser);
    }

    action.request();

    insertMessage('You', text, !!selectedUser);
    setText('');
  };

  const onSelectEmoji = (emojiData) => {
    if (!text) {
      setText('');
    }
    setText(prev => prev + emojiData.emoji);
  };

  const open = (roomData) => {
    setIsOpen(true);

    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }

    setUserSettings(prev => ({
      ...prev,
      newMessage: false,
    }));
  };

  // Expose open method
  React.useImperativeHandle(ref, () => ({ open }));

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={setIsOpen}
      id="chat-module"
      title="Messages"
    >
      <div className="messages" ref={messagesBoxRef}>
        {messages.map((message, index) => (
          <div key={index} className="message-item">
            <span>{message.from}</span>
            <small>{message.time}</small>
            {message.private && <small> (private)</small>}
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="user-send">
        {users.length > 0 && (
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value || null)}
          >
            {users.map((user, index) => (
              <option key={index} value={user.peerJsId || ''}>
                {user.name}
              </option>
            ))}
          </select>
        )}
        <div ref={emojiesBoxRef} className={`emojies-box ${showEmojiPicker ? 'show' : ''}`}>
          <EmojiPicker onEmojiClick={onSelectEmoji} native={true} />
        </div>
        <textarea
          rows="3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter message ..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <span className="emojies-toggler" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😊
        </span>
        <button className="send-btn" disabled={!text.trim()} onClick={sendMessage}>Send</button>
      </div>
    </Sidebar>
  );
});

ChatModule.displayName = 'ChatModule';

export default ChatModule;

