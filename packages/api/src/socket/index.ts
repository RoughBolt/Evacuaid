import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { config } from '../config';

let io: Server;

export const initSocket = async (server: HttpServer): Promise<Server> => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Redis adapter for horizontal scaling (optional for MVP)
  try {
    const pubClient = createClient({ url: config.redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[SOCKET] Redis adapter connected');
  } catch (err) {
    console.warn('[SOCKET] Redis unavailable — using in-memory adapter:', err);
  }

  io.on('connection', (socket: Socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Guest/Staff joins hotel room to receive all hotel-wide events
    socket.on('hotel:join', (data: { userId: string; role: string }) => {
      if (data.role === 'STAFF' || data.role === 'ADMIN') {
        socket.join('hotel_staff');
        console.log(`[SOCKET] Staff ${data.userId} joined hotel_staff room`);
      }
      socket.join('hotel_all');
    });

    // Guest joins their specific incident room for guidance updates
    socket.on('incident:join', (incidentId: string) => {
      socket.join(`incident_${incidentId}`);
      console.log(`[SOCKET] Client joined incident room: incident_${incidentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
