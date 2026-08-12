import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UserProfileService } from '../services/user-profile.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get(['users/profile', 'users/me', 'users/:id'])
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Req() req: any, @Param('id') id?: string) {
    const uid = id || req.user.uid;
    return await this.userProfileService.getProfile(uid);
  }

  @Put(['users/profile', 'users/:id'])
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    const uid = req.user.uid;
    return await this.userProfileService.updateProfile(uid, body);
  }

  @Get('reviews')
  async getReviews(@Query('propertyId') propertyId?: string) {
    return await this.userProfileService.getReviews(propertyId);
  }

  @Post('reviews')
  @UseGuards(FirebaseAuthGuard)
  async createReview(@Req() req: any, @Body() body: any) {
    const uid = req.user.uid;
    return await this.userProfileService.createReview(uid, body);
  }
}
