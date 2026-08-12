import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UserProfileService } from '../services/user-profile.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  // ── Profile ───────────────────────────────────────────────────────────────

  @Get(['users/profile', 'users/me'])
  @UseGuards(FirebaseAuthGuard)
  async getOwnProfile(@Req() req: any) {
    return this.userProfileService.getProfile(req.user.uid);
  }

  @Get('users/:id')
  @UseGuards(FirebaseAuthGuard)
  async getProfileById(@Param('id') id: string) {
    return this.userProfileService.getProfile(id);
  }

  @Put(['users/profile', 'users/me'])
  @UseGuards(FirebaseAuthGuard)
  async updateOwnProfile(@Req() req: any, @Body() body: any) {
    return this.userProfileService.updateProfile(req.user.uid, body);
  }

  @Put('users/:id')
  @UseGuards(FirebaseAuthGuard)
  async updateProfileById(@Param('id') id: string, @Body() body: any) {
    return this.userProfileService.updateProfile(id, body);
  }

  // ── Users admin ───────────────────────────────────────────────────────────

  /** GET /api/users — list all users */
  @Get('users')
  @UseGuards(FirebaseAuthGuard)
  async getAllUsers() {
    return this.userProfileService.getAllUsers();
  }

  /** POST /api/users — create a user record */
  @Post('users')
  @UseGuards(FirebaseAuthGuard)
  async createUser(@Body() body: any) {
    return this.userProfileService.createUser(body);
  }

  /** DELETE /api/users/:id */
  @Delete('users/:id')
  @UseGuards(FirebaseAuthGuard)
  async deleteUser(@Param('id') id: string) {
    return this.userProfileService.deleteUser(id);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  @Get('reviews')
  async getReviews(@Query('propertyId') propertyId?: string) {
    return this.userProfileService.getReviews(propertyId);
  }

  @Post('reviews')
  @UseGuards(FirebaseAuthGuard)
  async createReview(@Req() req: any, @Body() body: any) {
    return this.userProfileService.createReview(req.user.uid, body);
  }

  /** GET /api/reviews/stats */
  @Get('reviews/stats')
  async getReviewStats(@Query('propertyId') propertyId?: string) {
    return this.userProfileService.getReviewStats(propertyId);
  }
}
