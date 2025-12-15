import { ApiProperty } from '@nestjs/swagger';

export class privacyDto {
  @ApiProperty()
  privacyId: string;
  @ApiProperty()
  text: string;
  @ApiProperty()
  usertype: string;
}
