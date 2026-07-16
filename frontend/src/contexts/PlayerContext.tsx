import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

interface PlayerContextType {
  activeStream: any;
  isLoadingStream: boolean;
  isStreamError: boolean;
  isFetchingStream: boolean;
  refetchStream: () => void;
  isCurrentlyLive: boolean;
  servers: any[];
  selectedServer: { name: string; url: string } | null;
  setSelectedServer: (server: { name: string; url: string } | null) => void;
  isPlayerVisible: boolean;
  setIsPlayerVisible: (visible: boolean) => void;
  playerRect: { top: number; left: number; width: number; height: number };
  setPlayerRect: (rect: { top: number; left: number; width: number; height: number }) => void;
  hasAgreedToRules: boolean;
  setHasAgreedToRules: (agreed: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedServer, setSelectedServer] = useState<{ name: string; url: string } | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [playerRect, setPlayerRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [hasAgreedToRulesState, setHasAgreedToRulesState] = useState(false);

  const { data: activeStream, isLoading: isLoadingStream, isError: isStreamError, refetch: refetchStream, isFetching: isFetchingStream } = useQuery({
    queryKey: ['activeStream'],
    queryFn: async () => {
      try {
        return await apiClient('/streams/active');
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 10000,
  });

  const isCurrentlyLive = activeStream?.isLive || false;

  let servers = activeStream?.servers || [];
  if (servers.length === 0 && activeStream?.streamUrl) {
    servers = [{ name: 'Server A', url: activeStream.streamUrl }];
  }

  // Auto-select first server if none selected
  useEffect(() => {
    if (activeStream?._id) {
      const agreed = localStorage.getItem(`agreed_relay_${activeStream._id}`) === 'true';
      if (agreed && !hasAgreedToRulesState) {
        setHasAgreedToRulesState(true);
      }
    }
  }, [activeStream?._id]);

  const setHasAgreedToRules = (agreed: boolean) => {
    setHasAgreedToRulesState(agreed);
    if (agreed && activeStream?._id) {
      localStorage.setItem(`agreed_relay_${activeStream._id}`, 'true');
    }
  };

  useEffect(() => {
    if (servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0]);
    } else if (servers.length === 0 && selectedServer) {
      setSelectedServer(null);
    } else if (servers.length > 0 && selectedServer) {
      // Ensure the selected server still exists in the updated stream data
      const exists = servers.find((s: any) => s.name === selectedServer.name);
      if (!exists) setSelectedServer(servers[0]);
    }
  }, [servers, selectedServer]);

  // Hide player if stream goes offline
  useEffect(() => {
    if (!isCurrentlyLive || isStreamError) {
      setIsPlayerVisible(false);
      setHasAgreedToRulesState(false); // Reset agreement when stream goes offline
    }
  }, [isCurrentlyLive, isStreamError]);

  return (
    <PlayerContext.Provider
      value={{
        activeStream,
        isLoadingStream,
        isStreamError,
        isFetchingStream,
        refetchStream,
        isCurrentlyLive,
        servers,
        selectedServer,
        setSelectedServer,
        isPlayerVisible,
        setIsPlayerVisible,
        playerRect,
        setPlayerRect,
        hasAgreedToRules: hasAgreedToRulesState,
        setHasAgreedToRules,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
