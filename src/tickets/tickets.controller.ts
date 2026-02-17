import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  createTicket(
    @Body('userId') userId: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    return this.ticketsService.createTicket(userId, subject, message);
  }

  @Post(':id/message')
  sendMessage(
    @Param('id') ticketId: string,
    @Body() body,
  ) {
    return this.ticketsService.sendMessage(
      ticketId,
      body.senderType,
      body.senderId,
      body.message,
    );
  }

  @Get('user')
  getUserTickets(@Query('userId') userId: string) {
    return this.ticketsService.getUserTickets(userId);
  }

  @Get('admin')
  getAdminTickets(@Query('status') status?: string) {
    return this.ticketsService.getAdminTickets(status);
  }

  @Get(':id/messages')
  getMessages(@Param('id') ticketId: string) {
    return this.ticketsService.getTicketMessages(ticketId);
  }

  @Post(':id/close')
  closeTicket(@Param('id') ticketId: string) {
    return this.ticketsService.closeTicket(ticketId);
  }
}
