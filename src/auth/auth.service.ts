import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
var fs = require('fs');
import moment = require('moment');

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async createToken(user: any):Promise<{token: string} | any> {
        const secretKey = process.env.JWT_SECRET;
        const jwtToken = await this.jwtService.signAsync({user}, {secret: secretKey});
        return jwtToken
    }

    async hashPassword(password: string) {
        const bcryptPassword = await bcrypt.hash(password, 10);
        return bcryptPassword
    }

    async comparePassword(password: string, hashedPassword: string) {
        const matchPassword = await bcrypt.compare(password, hashedPassword);
        return matchPassword
    }

    async verifyToken(token: string): Promise<any> {
        try {
          return this.jwtService.verify(token);
        } catch (error) {
          return null;
        }
      }

      async saveFile(file: any): Promise<any> {
        try {
          let fileName = file.originalname;
          fileName = fileName.replace(/\//g, '-');
          fileName = fileName.replace(/ /g, '_');
          fileName = fileName.replace(/[()]/g, '');
    
          const filePath = moment() + '-' + fileName;
    
          console.log(filePath);
          await fs.writeFileSync('./files/' + filePath, file.buffer, 'buffer');
    
          return filePath;
        } catch (err) {
          // An error occurred
          console.error(err);
        }
    }
}
