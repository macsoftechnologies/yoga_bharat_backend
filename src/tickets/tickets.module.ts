import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schema/ticket.schema';
import { TicketMessage, TicketMessageSchema } from './schema/ticket-message.schema';
import { TicketsGateway } from './tickets.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: TicketMessage.name, schema: TicketMessageSchema },
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway],
})
export class TicketsModule {}
