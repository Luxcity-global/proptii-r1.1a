import { Module } from '@nestjs/common';
import { AuthController } from '../../controllers/auth.controller';
import { UserProfileController } from '../../controllers/user-profile.controller';
import { UserProfileService } from '../../services/user-profile.service';

@Module({
  controllers: [AuthController, UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class AuthModule {}
