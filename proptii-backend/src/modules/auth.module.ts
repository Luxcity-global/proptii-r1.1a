import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../guards/jwt.strategy';
import { AuthController } from '../controllers/auth.controller';

/**
 * AuthModule wires Passport and the JWT strategy.
 * Import this module into AppModule (or any feature module that needs guards).
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}

