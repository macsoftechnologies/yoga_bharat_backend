import { ApiProperty } from '@nestjs/swagger';

export class termsDto {
  @ApiProperty()
  termsId: string;
  @ApiProperty()
  text: string;
  @ApiProperty()
  usertype: string;
}
