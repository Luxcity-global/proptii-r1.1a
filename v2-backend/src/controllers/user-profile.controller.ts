import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserProfileService } from '../services/user-profile.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class UserProfileController {
  private readonly logger = new Logger(UserProfileController.name);

  constructor(private readonly userProfileService: UserProfileService) {}

  private getAdminEmails(): string[] {
    const raw = `${process.env.ADMIN_EMAILS || ''},${process.env.ADMIN_EMAIL || ''}`;
    const emails = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));
    return Array.from(new Set(emails));
  }

  private assertAdminUser(req: any): void {
    const userEmail = req.user?.email?.trim().toLowerCase();
    const isExplicitAdmin = req.user?.role === 'admin' || req.user?.admin === true;
    if (isExplicitAdmin) return;

    const adminEmails = this.getAdminEmails();
    if (adminEmails.length === 0 || !userEmail || !adminEmails.includes(userEmail)) {
      throw new ForbiddenException('Access denied: Administrative privileges required.');
    }
  }

  private isUserAdmin(req: any): boolean {
    try {
      this.assertAdminUser(req);
      return true;
    } catch {
      return false;
    }
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  @Get(['users/profile', 'users/me'])
  @UseGuards(FirebaseAuthGuard)
  async getOwnProfile(@Req() req: any) {
    return this.userProfileService.getProfile(req.user.uid);
  }

  @Get('users/:id')
  @UseGuards(FirebaseAuthGuard)
  async getProfileById(@Param('id') id: string, @Req() req: any) {
    // Only allow users to view their own full profile or admins
    if (req.user.uid !== id && !this.isUserAdmin(req)) {
      const publicProfile: any = await this.userProfileService.getProfile(id);
      return {
        uid: publicProfile.uid,
        name: publicProfile.name || publicProfile.displayName,
        role: publicProfile.role,
        photoURL: publicProfile.photoURL,
      };
    }
    return this.userProfileService.getProfile(id);
  }

  @Put(['users/profile', 'users/me'])
  @UseGuards(FirebaseAuthGuard)
  async updateOwnProfile(@Req() req: any, @Body() body: any) {
    const isAdmin = this.isUserAdmin(req);
    // Standard users cannot alter their own system role via profile update
    const safeBody = isAdmin ? body : { ...body, role: undefined, admin: undefined };
    delete safeBody.role;
    delete safeBody.admin;
    return this.userProfileService.updateProfile(req.user.uid, safeBody);
  }

  @Put('users/:id')
  @UseGuards(FirebaseAuthGuard)
  async updateProfileById(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const isAdmin = this.isUserAdmin(req);
    if (req.user.uid !== id && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify another user profile.');
    }
    const safeBody = isAdmin ? body : { ...body, role: undefined, admin: undefined };
    if (!isAdmin) {
      delete safeBody.role;
      delete safeBody.admin;
    }
    return this.userProfileService.updateProfile(id, safeBody);
  }

  // ── Users admin ───────────────────────────────────────────────────────────

  /** GET /api/users — list all users (admin only) */
  @Get('users')
  @UseGuards(FirebaseAuthGuard)
  async getAllUsers(@Req() req: any) {
    this.assertAdminUser(req);
    return this.userProfileService.getAllUsers();
  }

  /** POST /api/users — create a user record (admin only) */
  @Post('users')
  @UseGuards(FirebaseAuthGuard)
  async createUser(@Req() req: any, @Body() body: any) {
    this.assertAdminUser(req);
    return this.userProfileService.createUser(body);
  }

  /** DELETE /api/users/:id (admin only) */
  @Delete('users/:id')
  @UseGuards(FirebaseAuthGuard)
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    this.assertAdminUser(req);
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
