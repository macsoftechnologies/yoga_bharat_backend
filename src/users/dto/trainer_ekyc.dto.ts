import { ApiProperty } from '@nestjs/swagger';

export class trainerEKYCDto {
  @ApiProperty()
  userId: string
  @ApiProperty({ required: false, type: [String] })
  journey_images: string[];
  @ApiProperty({required: false,})
  yoga_video: string;
  @ApiProperty()
  recipient_name: string;
  @ApiProperty()
  account_no: string;
  @ApiProperty()
  ekyc_status: string;
  @ApiProperty()
  ifsc_code: string;
  @ApiProperty()
  account_branch: string;
  @ApiProperty()
  branch_address: string
}
