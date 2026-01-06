import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveJourneyImageDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  imageName: string;
}