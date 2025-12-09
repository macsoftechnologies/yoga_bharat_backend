import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'], 
    }),
  ],
})
export class ConfigAppModule {}
