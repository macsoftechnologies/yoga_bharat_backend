import { ApiProperty } from '@nestjs/swagger';

export class featuresDto {
  @ApiProperty()
  featureId: string;
  @ApiProperty()
  feature_image: string;
  @ApiProperty()
  usertype: string;
  @ApiProperty()
  link: string;
}
