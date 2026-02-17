import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TicketsService } from './tickets.service';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class TicketsGateway {
  @WebSocketServer()
  server: Server;

  constructor(@Inject(forwardRef(() => TicketsService))
  private readonly ticketsService: TicketsService,) {}

  @SubscribeMessage('joinTicket')
  handleJoin(@MessageBody() ticketId: string) {
    return { joined: ticketId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data) {
    await this.ticketsService.sendMessage(
      data.ticketId,
      data.senderType,
      data.senderId,
      data.message,
    );

    this.server.emit(`ticket-${data.ticketId}`, data);
  }

  emitNewMessage(ticketId: string, message: any) {
    this.server.to(ticketId).emit('newMessage', message);
  }
}
