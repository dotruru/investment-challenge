import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LiveStateService } from '../live-state/live-state.service';

interface ClientData {
  eventId: string;
  clientType: 'operator' | 'audience' | 'jury';
  juryId?: string;
  userId?: string;
  authenticated: boolean;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5101', 'http://localhost:5102'],
    credentials: true,
  },
  namespace: '/event',
})
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventGateway');

  constructor(
    private configService: ConfigService,
    private liveStateService: LiveStateService,
    private jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const { eventId, clientType, juryId } = client.handshake.query as Record<string, string>;
    const token = client.handshake.auth?.token || client.handshake.query?.token as string;
    
    this.logger.log(`Client connected: ${client.id} (${clientType}) for event ${eventId}`);

    let authenticated = false;
    let userId: string | undefined;

    // Operator connections require authentication
    if (clientType === 'operator') {
      if (!token) {
        this.logger.warn(`Operator connection rejected - no token: ${client.id}`);
        client.emit('error', { message: 'Authentication required for operator' });
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        authenticated = true;
        userId = payload.sub;
        this.logger.log(`Operator authenticated: ${client.id} (user: ${userId})`);
      } catch (error) {
        this.logger.warn(`Operator connection rejected - invalid token: ${client.id}`);
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect();
        return;
      }
    } else {
      // Audience connections are allowed without auth (read-only)
      authenticated = clientType === 'audience';
    }

    // Store client data
    client.data = {
      eventId,
      clientType,
      juryId,
      userId,
      authenticated,
    } as ClientData;

    // Auto-join the event room if eventId is provided
    if (eventId) {
      await client.join(`event:${eventId}`);
      await client.join(`event:${eventId}:${clientType}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:event')
  async handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string },
  ) {
    const { eventId } = payload;
    const clientData = client.data as ClientData;

    // Leave previous room if any
    if (clientData.eventId && clientData.eventId !== eventId) {
      await client.leave(`event:${clientData.eventId}`);
      await client.leave(`event:${clientData.eventId}:${clientData.clientType}`);
    }

    // Update client data
    client.data = { ...clientData, eventId };

    // Join new room
    await client.join(`event:${eventId}`);
    await client.join(`event:${eventId}:${clientData.clientType}`);

    // Send current state
    try {
      const state = await this.liveStateService.getState(eventId);
      client.emit('state:update', state);
    } catch (error) {
      this.logger.error(`Failed to get state for event ${eventId}:`, error);
    }

    return { success: true, eventId };
  }

  @SubscribeMessage('leave:event')
  async handleLeaveEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string },
  ) {
    const { eventId } = payload;
    const clientData = client.data as ClientData;

    await client.leave(`event:${eventId}`);
    await client.leave(`event:${eventId}:${clientData.clientType}`);

    return { success: true };
  }

  @SubscribeMessage('request:state')
  async handleRequestState(@ConnectedSocket() client: Socket) {
    const { eventId } = client.data as ClientData;

    if (!eventId) {
      return { error: 'Not joined to any event' };
    }

    try {
      const state = await this.liveStateService.getState(eventId);
      client.emit('state:update', state);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to get state:`, error);
      return { error: 'Failed to get state' };
    }
  }

  // Broadcast methods for use by other services
  broadcastStateChange(eventId: string, eventType: string, payload: any) {
    this.server.to(`event:${eventId}`).emit(eventType, payload);
  }

  broadcastToOperator(eventId: string, eventType: string, payload: any) {
    this.server.to(`event:${eventId}:operator`).emit(eventType, payload);
  }

  broadcastToAudience(eventId: string, eventType: string, payload: any) {
    this.server.to(`event:${eventId}:audience`).emit(eventType, payload);
  }

  broadcastToJury(eventId: string, eventType: string, payload: any) {
    this.server.to(`event:${eventId}:jury`).emit(eventType, payload);
  }

  // Timer sync broadcast
  broadcastTimerSync(eventId: string, timerState: any) {
    this.server.to(`event:${eventId}`).emit('timer:sync', timerState);
  }

  // Animation trigger broadcast
  broadcastAnimationTrigger(eventId: string, animation: string, params?: any) {
    this.server.to(`event:${eventId}`).emit('animation:trigger', { animation, params });
  }

  // Stage change broadcast
  broadcastStageChange(eventId: string, stage: any) {
    this.server.to(`event:${eventId}`).emit('stage:changed', { stage });
  }

  // Team selection broadcast
  broadcastTeamSelected(eventId: string, team: any) {
    this.server.to(`event:${eventId}`).emit('team:selected', { team });
  }

  // Round randomized broadcast
  broadcastRoundRandomized(eventId: string, teamOrder: any[]) {
    this.server.to(`event:${eventId}`).emit('round:randomized', { teamOrder });
  }

  // Score submitted broadcast (to operator only)
  broadcastScoreSubmitted(eventId: string, data: { teamId: string; juryId: string; juryName: string; score?: number }) {
    this.server.to(`event:${eventId}:operator`).emit('score:submitted', data);
  }
}

