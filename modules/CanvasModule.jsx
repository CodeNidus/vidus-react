import React, { useState, useImperativeHandle, useRef } from 'react';
import { useVidus } from '../context/VidusContext';
import Icon from '../helpers/Icon';
import './CanvasModule.css';

const CanvasModule = React.forwardRef(({ room }, ref) => {
  const { webrtc } = useVidus();
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef(null);

  const filteredActions = React.useMemo(() => {
    const actions = {};
    for (const [key, value] of Object.entries(webrtc.actions)) {
      if (value?.category?.includes('canvas')) {
        actions[key] = value;
      }
    }
    return actions;
  }, [webrtc.actions]);

  const open = () => {
    setIsVisible((prevVisible) => {
      const newVisible = !prevVisible;
      webrtc.emit('onCanvasDisplay', {
        show: newVisible
      });
      return newVisible;
    });
  };

  const setAction = (name, object) => {
    webrtc.registerActionReference(name, object);
  };

  const runAction = (action) => {
    const actionInstance = webrtc.getAction(action.name);
    actionInstance.run(room, action?.data || {});
  };

  useImperativeHandle(ref, () => ({ open }));

  if (!isVisible) return null;

  return (
    <div id="canvas-module" className="module">
      <div id="canvas-module-area">
        <div id="canvas-module-actions-dock">

        {Object.entries(filteredActions).map(([key, action], index) => {
            return (
              <div
                className="btn btn-small mx-2 circle"
                onClick={runAction(action)}
              >
                <Icon icon={action.icon} size="16" />
              </div>
            );
          })}

        </div>
        <div id="canvas-module-custom-actions">

          {Object.entries(filteredActions).map(([key, action], index) => {
            if (!action.view) return null;
            const ActionComponent = action.view;
            return (
              <ActionComponent
                ref={(el) => setAction(key, el)}
                room={room}
                canvas={canvasRef}
                userSettings={webrtc.userSettings}
              />
            );
          })}

        </div>
        <canvas ref={canvasRef} id="canvas-module-canvas" height="250" />
      </div>
    </div>
  );
});

CanvasModule.displayName = 'CanvasModule';

export default CanvasModule;

