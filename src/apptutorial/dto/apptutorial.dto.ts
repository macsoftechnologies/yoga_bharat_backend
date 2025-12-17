import { ApiProperty } from '@nestjs/swagger';

export class apptutorialDto {
  @ApiProperty()
  appId: string;
  @ApiProperty()
  app_image: string;
  @ApiProperty()
  usertype: string;
}
