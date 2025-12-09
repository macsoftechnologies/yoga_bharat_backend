import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // 👈 'jwt' name is CRITICAL
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // 👈 MUST match your JwtModule secret
    });
  console.log('✅ JwtStrategy initialized');
  }

  async validate(payload: any) {
    // 👇 request.user will contain this
    return payload;
  }
}
