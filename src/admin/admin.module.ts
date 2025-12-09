import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './schema/admin.schema';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MongooseModule.forFeature([{name: Admin.name, schema: adminSchema}])],
  controllers: [AdminController],
  providers: [AdminService, AuthService, JwtService]
})
export class AdminModule {}
