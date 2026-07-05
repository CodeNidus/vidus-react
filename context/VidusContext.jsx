import React, { createContext, useContext, useEffect, useState } from 'react';
import vidus from 'vidus-core';

const VidusContext = createContext(null);

export const useVidus = () => {
  const context = useContext(VidusContext);
  if (!context) {
    throw new Error('useVidus must be used within a VidusProvider');
  }
  return context;
};

export const VidusProvider = ({ children, configs = {}, actions = {}, themes = {}, overrides = {} }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    vidus.initial(configs, actions, themes, overrides)
      .then(() => {
        setInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize Vidus:', error);
      });
  }, [configs, actions, themes, overrides]);

  const value = {
    webrtc: vidus,
    initialized
  };

  return (
    <VidusContext.Provider value={value}>
      {children}
    </VidusContext.Provider>
  );
};

export default VidusContext;