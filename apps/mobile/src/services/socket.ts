import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { useAppStore } from '../store/useAppStore';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Hook — connect to Socket.IO and join hotel room on mount.
 * Handles reconnect and emits hotel:join once connected.
 */
export const useSocket = () => {
  const user = useAppStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const sock = getSocket();
    socketRef.current = sock;

    const onConnect = () => {
      console.log('[SOCKET] Connected:', sock.id);
      sock.emit('hotel:join', { userId: user.id, role: user.role });
    };

    const onDisconnect = () => {
      console.log('[SOCKET] Disconnected');
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);

    if (sock.connected) {
      onConnect();
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
    };
  }, [user]);

  return socketRef;
};

/**
 * Join a specific incident room for real-time guidance updates
 */
export const joinIncidentRoom = (incidentId: string) => {
  const sock = getSocket();
  sock.emit('incident:join', incidentId);
};
