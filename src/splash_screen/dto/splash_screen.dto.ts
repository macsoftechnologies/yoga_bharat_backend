import { ApiProperty } from '@nestjs/swagger';

export class splashScreenDto {
  @ApiProperty()
  splashscreenId: string;
  @ApiProperty()
  text: string;
  @ApiProperty()
  screen_type: string;
  @ApiProperty()
  screen_no: string;
}
