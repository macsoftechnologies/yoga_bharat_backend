import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from './schema/ticket.schema';
import { TicketMessage } from './schema/ticket-message.schema';
import { TicketsGateway } from './tickets.gateway';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private ticketModel: Model<Ticket>,

    @InjectModel(TicketMessage.name)
    private ticketMessageModel: Model<TicketMessage>,
    
  @Inject(forwardRef(() => TicketsGateway))
  private readonly ticketsGateway: TicketsGateway
  ) {}

  async createTicket(userId: string, subject: string, message: string) {
    const ticket = await this.ticketModel.create({
      ticketId: `TKT-${Date.now()}`,
      userId,
      subject,
    });

    await this.ticketMessageModel.create({
      ticketId: ticket._id,
      senderType: 'USER',
      senderId: userId,
      message,
    });

    return ticket;
  }

  async sendMessage(
    ticketId: string,
    senderType: 'USER' | 'ADMIN',
    senderId: string,
    message: string,
  ) {
    const ticket = await this.ticketModel.findById(ticketId);

    if (!ticket || ticket.isClosed) {
      throw new BadRequestException('Ticket is closed or invalid');
    }

    const savedMessage = await this.ticketMessageModel.create({
      ticketId,
      senderType,
      senderId,
      message,
    });

    await this.ticketModel.findByIdAndUpdate(ticketId, {
      lastMessage: message,
      status: senderType === 'ADMIN' ? 'IN_PROGRESS' : 'OPEN',
    });

    this.ticketsGateway.emitNewMessage(ticketId, savedMessage);
  }

  async getUserTickets(userId: string) {
    return this.ticketModel.find({ userId }).sort({ updatedAt: -1 });
  }

  async getAdminTickets(status?: string) {
    return this.ticketModel
      .find(status ? { status } : {})
      .sort({ updatedAt: -1 });
  }

  async getTicketMessages(ticketId: string) {
    return this.ticketMessageModel
      .find({ ticketId })
      .sort({ createdAt: 1 });
  }

  async closeTicket(ticketId: string) {
    return this.ticketModel.findByIdAndUpdate(ticketId, {
      status: 'CLOSED',
      isClosed: true,
    });
  }
}
