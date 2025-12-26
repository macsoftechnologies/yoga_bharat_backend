import { ApiProperty } from '@nestjs/swagger';

export class yogaDetailsDto {
  @ApiProperty()
  yogaId: string;
  @ApiProperty()
  yoga_name: string;
  @ApiProperty()
  client_price: string;
  @ApiProperty()
  trainer_price: string;
  @ApiProperty()
  yoga_desc: string;
  @ApiProperty()
  yoga_image: string;
  @ApiProperty()
  yoga_icon: string;
  @ApiProperty()
  duration:string
}
