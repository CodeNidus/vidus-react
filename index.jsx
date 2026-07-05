import React from 'react';
import { VidusProvider, useVidus } from './context/VidusContext';
import VCRooms from './components/Rooms';
import VCRoomJoin from './components/RoomJoin';
import VCDialog from './helpers/Dialog';

export { VidusProvider, useVidus };
export { VCRooms, VCRoomJoin, VCDialog };


export function VidusCreator(options = {}) {
  const { configs = {}, actions = {}, themes = {}, overrides = {} } = options;

  return {
    configs,
    actions,
    themes,
    overrides,
    Provider: ({ children }) => (
      <VidusProvider
        configs={configs}
        actions={actions}
        themes={themes}
        overrides={overrides}
      >
        {children}
      </VidusProvider>
    )
  };
}

const VidusReact = {
  VCRooms,
  VCRoomJoin,
  VCDialog,
  VidusProvider,
  useVidus,
  VidusCreator
};

export default VidusReact;