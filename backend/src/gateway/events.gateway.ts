import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();
  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    // Remove from user map
    for (const [userId, socketId] of this.userSockets) {
      if (socketId === client.id) { this.userSockets.delete(userId); break; }
    }
  }

  // ---- Room Management ----

  @SubscribeMessage('join:room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
  }

  @SubscribeMessage('leave:room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
  }

  @SubscribeMessage('auth:register')
  handleAuthRegister(client: Socket, userId: string) {
    this.userSockets.set(userId, client.id);
    client.join(`user:${userId}`);
  }

  // ---- Chat Events ----

  @SubscribeMessage('chat:join')
  handleChatJoin(client: Socket, data: { complaintId: string }) {
    client.join(`complaint:${data.complaintId}`);
  }

  @SubscribeMessage('chat:leave')
  handleChatLeave(client: Socket, data: { complaintId: string }) {
    client.leave(`complaint:${data.complaintId}`);
  }

  @SubscribeMessage('chat:typing_start')
  handleTypingStart(client: Socket, data: { complaintId: string; userId: string }) {
    client.to(`complaint:${data.complaintId}`).emit('chat:typing', {
      complaintId: data.complaintId,
      userId: data.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('chat:typing_stop')
  handleTypingStop(client: Socket, data: { complaintId: string; userId: string }) {
    client.to(`complaint:${data.complaintId}`).emit('chat:typing', {
      complaintId: data.complaintId,
      userId: data.userId,
      isTyping: false,
    });
  }

  // ---- Team Availability ----

  @SubscribeMessage('team:set_availability')
  handleSetAvailability(client: Socket, data: { teamId: string; memberId: string; status: string }) {
    this.server.emit('team:availability_changed', data);
  }

  // ---- Server → Client Emitters ----

  /** Emit new feedback event */
  emitFeedbackNew(data: any) {
    this.server.emit('feedback:new', data);
  }

  /** Emit complaint status update */
  emitComplaintStatusChanged(data: { complaintId: string; fromStatus: string; toStatus: string; changedBy: string; timestamp: string }) {
    this.server.to(`complaint:${data.complaintId}`).emit('complaint:status_changed', data);
    this.server.emit('complaint:updated', data); // global broadcast for dashboards
  }

  /** Emit complaint escalated */
  emitComplaintEscalated(data: { complaintId: string; toLevel: number; toAssignee?: string; reason: string }) {
    this.server.to(`complaint:${data.complaintId}`).emit('complaint:escalated', data);
    this.server.emit('escalation:new', data);
  }

  /** Emit complaint assigned */
  emitComplaintAssigned(data: { complaintId: string; teamId: string; assigneeId?: string }) {
    this.server.to(`complaint:${data.complaintId}`).emit('complaint:assigned', data);
  }

  /** Emit chat message to complaint room */
  emitChatMessage(complaintId: string, data: any) {
    this.server.to(`complaint:${complaintId}`).emit('chat:message', data);
  }

  /** Emit message read receipt */
  emitChatRead(data: { complaintId: string; messageId: string; readBy: string; readAt: string }) {
    this.server.to(`complaint:${data.complaintId}`).emit('chat:read', data);
  }

  /** Emit SLA warning */
  emitSLAWarning(data: { complaintId: string; priority: string; percentRemaining: number; deadline: string }) {
    this.server.to(`complaint:${data.complaintId}`).emit('sla:warning', data);
  }

  /** Emit SLA breach */
  emitSLABreached(data: { complaintId: string; priority: string; hoursOverdue: number }) {
    this.server.to(`complaint:${data.complaintId}`).emit('sla:breached', data);
    this.server.emit('sla:breached', data); // global for admin
  }

  /** Emit resolution requested */
  emitResolutionRequested(data: { complaintId: string; employeeId: string }) {
    this.server.to(`complaint:${data.complaintId}`).emit('resolution:requested', data);
  }

  /** Emit resolution confirmed */
  emitResolutionConfirmed(data: { complaintId: string; decision: string; satisfactionRating?: number }) {
    this.server.to(`complaint:${data.complaintId}`).emit('resolution:confirmed', data);
  }

  /** Send notification to specific user */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /** Emit AI alert */
  emitAlert(data: any) {
    this.server.emit('alert:triggered', data);
  }

  /** Emit dashboard metric update */
  emitMetricsUpdate(data: any) {
    this.server.emit('dashboard:metrics', data);
  }
}
