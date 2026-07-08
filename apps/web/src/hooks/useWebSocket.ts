import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { campaignsApi } from '@/store/api/campaignsApi';
import { charactersApi } from '@/store/api/charactersApi';
import { useAppDispatch } from '@/store/hooks';
import type {
  Character,
  LiveFieldsUpdate,
  LiveUpdatePayload,
  PaginatedResponse,
} from '@/types/api';

function applyLiveFieldsToCharacter(character: Character, data: LiveUpdatePayload): void {
  if ('fields' in data && data.fields) {
    Object.assign(character, data.fields);
    return;
  }
  if ('field' in data && data.field !== undefined) {
    Object.assign(character, { [data.field]: data.value });
  }
}

function patchCharacterListCaches(
  dispatch: ReturnType<typeof useAppDispatch>,
  campaignId: string,
  data: LiveUpdatePayload,
): void {
  dispatch(
    charactersApi.util.updateQueryData('getCharacters', { campaignId, limit: 50 }, (draft) => {
      const list = draft as PaginatedResponse<Character>;
      const target = list.data.find((c) => c.id === data.characterId);
      if (target) {
        applyLiveFieldsToCharacter(target, data);
      }
    }),
  );

  dispatch(
    charactersApi.util.updateQueryData('getCharacter', data.characterId, (draft) => {
      if (draft?.data) {
        applyLiveFieldsToCharacter(draft.data, data);
      }
    }),
  );
}

export function useWebSocket(campaignId: string | undefined): {
  isConnected: boolean;
  reconnectAttempt: number;
} {
  const { accessToken } = useAuth();
  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    if (!campaignId || !accessToken) {
      setIsConnected(false);
      setReconnectAttempt(0);
      return;
    }

    const socket = connectSocket(accessToken);

    const handleConnect = () => {
      setIsConnected(true);
      setReconnectAttempt(0);
      socket.emit('join-campaign', { campaignId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleReconnectAttempt = (attempt: number) => {
      setIsConnected(false);
      setReconnectAttempt(attempt);
    };

    const handleLiveUpdate = (data: LiveUpdatePayload) => {
      patchCharacterListCaches(dispatch, campaignId, data);
    };

    const handleMemberJoined = () => {
      dispatch(campaignsApi.util.invalidateTags([{ type: 'CampaignMember', id: campaignId }]));
    };

    const handleMemberLeft = () => {
      dispatch(campaignsApi.util.invalidateTags([{ type: 'CampaignMember', id: campaignId }]));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('character:live-update', handleLiveUpdate);
    socket.on('campaign:member-joined', handleMemberJoined);
    socket.on('campaign:member-left', handleMemberLeft);

    if (socket.connected) {
      handleConnect();
    } else {
      setIsConnected(false);
    }

    return () => {
      socket.emit('leave-campaign', { campaignId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('character:live-update', handleLiveUpdate);
      socket.off('campaign:member-joined', handleMemberJoined);
      socket.off('campaign:member-left', handleMemberLeft);
      // Disconnect fully on unmount of this screen.
      disconnectSocket();
    };
  }, [campaignId, accessToken, dispatch]);

  // Re-auth: if token rotates while connected, reconnect with new token
  useEffect(() => {
    if (!campaignId || !accessToken) return;
    const socket = getSocket();
    if (!socket) return;
    socket.auth = { token: accessToken };
  }, [accessToken, campaignId]);

  return { isConnected, reconnectAttempt };
}

export type { LiveFieldsUpdate };
