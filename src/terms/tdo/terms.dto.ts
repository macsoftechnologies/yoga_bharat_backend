import { ApiProperty } from '@nestjs/swagger';

export class termsDto {
  @ApiProperty()
  termsId: string;
  @ApiProperty()
  usertype: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  message: string;
  @ApiProperty()
  terms_and_conditions: string;
}
