import { ApiProperty } from '@nestjs/swagger';

export class trainerEKYCDto {
  @ApiProperty()
  userId: string
  @ApiProperty({ type: [String] })
  certificates: string[];
  @ApiProperty({ type: [String] })
  journey_images: string[];
  @ApiProperty()
  yoga_video: string;
  @ApiProperty()
  recipient_name: string;
  @ApiProperty()
  account_no: string;
  @ApiProperty()
  ekyc_status: string;
}
