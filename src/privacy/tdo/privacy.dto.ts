import { ApiProperty } from '@nestjs/swagger';

export class privacyDto {
  @ApiProperty()
  privacyId: string;
  @ApiProperty()
  privacy_policy: string;
  @ApiProperty()
  usertype: string;
  @ApiProperty()
  status: string
  @ApiProperty()
  message: string
}
