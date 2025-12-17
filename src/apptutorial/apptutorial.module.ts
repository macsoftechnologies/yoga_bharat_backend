import { Module } from '@nestjs/common';
import { ApptutorialService } from './apptutorial.service';
import { ApptutorialController } from './apptutorial.controller';
import { AppTutorial, AppTutorialSchema } from './schema/apptutorial.schema';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppTutorial.name, schema: AppTutorialSchema },
    ]),
  ],
  controllers: [ApptutorialController],
  providers: [ApptutorialService],
})
export class ApptutorialModule {}
