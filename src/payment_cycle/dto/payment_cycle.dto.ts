
export interface EnrichedEarning {
  _id: string;
  bookingId: string;
  trainerId: string;
  clientId: string;
  yogaId: string;
  earningId: string;
  earned_amount: number;
  date: string;
  paymentCycleId: string;
  settlementStatus: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  trainerName: string;
  clientName: string;
  yogaName: string;
  clientPrice: number;
  trainerPrice: number;
}

export interface CycleWithEarningsResponse {
  statusCode: number;
  message: string;
  totalSessions: number;
  data: any;
  earnings: EnrichedEarning[];
}