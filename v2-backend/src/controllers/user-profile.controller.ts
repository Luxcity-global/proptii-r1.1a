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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserProfileService } from '../services/user-profile.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Users')
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
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Own user profile document' })
  async getOwnProfile(@Req() req: any) {
    return this.userProfileService.getProfile(req.user.uid);
  }

  @Get('users/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get user profile by ID (sanitized public profile if viewing other user)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile or public profile preview' })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update own user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update user profile by ID (admin or self)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 403, description: 'Forbidden if modifying another user without admin role' })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all registered users (admin only)' })
  @ApiResponse({ status: 200, description: 'Array of user documents' })
  @ApiResponse({ status: 403, description: 'Access denied: Admin privileges required' })
  async getAllUsers(@Req() req: any) {
    this.assertAdminUser(req);
    return this.userProfileService.getAllUsers();
  }

  /** POST /api/users — create a user record (admin only) */
  @Post('users')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create user record (admin only)' })
  @ApiResponse({ status: 201, description: 'User record created' })
  async createUser(@Req() req: any, @Body() body: any) {
    this.assertAdminUser(req);
    return this.userProfileService.createUser(body);
  }

  /** DELETE /api/users/:id (admin only) */
  @Delete('users/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete user record (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User record deleted' })
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    this.assertAdminUser(req);
    return this.userProfileService.deleteUser(id);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews (optional filter by propertyId)' })
  @ApiQuery({ name: 'propertyId', required: false, description: 'Filter reviews by property ID' })
  @ApiResponse({ status: 200, description: 'Array of review items' })
  async getReviews(@Query('propertyId') propertyId?: string) {
    return this.userProfileService.getReviews(propertyId);
  }

  @Post('reviews')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Submit a new review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async createReview(@Req() req: any, @Body() body: any) {
    return this.userProfileService.createReview(req.user.uid, body);
  }

  /** GET /api/reviews/stats */
  @Get('reviews/stats')
  @ApiOperation({ summary: 'Aggregate statistics for reviews' })
  @ApiQuery({ name: 'propertyId', required: false, description: 'Filter review stats by property ID' })
  @ApiResponse({ status: 200, description: 'Review stats object (average rating, count)' })
  async getReviewStats(@Query('propertyId') propertyId?: string) {
    return this.userProfileService.getReviewStats(propertyId);
  }
}
