import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

class AddAdminNoteDto {
  @IsString()
  @MinLength(1)
  note: string;

  @IsOptional()
  @IsString()
  tag?: string;
}

@Controller('admin')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboard: AdminDashboardService) {}

  @Get('me')
  me(@Req() req: any) {
    return { ok: true, email: req.user?.email, role: 'staff' };
  }

  @Get('customers')
  listCustomers(@Req() req: any) {
    return this.adminDashboard.listCustomers(req.user?.email || 'unknown');
  }

  @Get('customers/:id')
  getCustomer(@Req() req: any, @Param('id') id: string) {
    return this.adminDashboard.getCustomer(req.user?.email || 'unknown', id);
  }

  @Post('customers/:id/notes')
  addNote(@Req() req: any, @Param('id') id: string, @Body() body: AddAdminNoteDto) {
    return this.adminDashboard.addNote(
      req.user?.email || 'unknown',
      id,
      body.note,
      body.tag,
    );
  }

  @Get('overview')
  overview(@Req() req: any) {
    return this.adminDashboard.overview(req.user?.email || 'unknown');
  }

  @Get('alerts')
  alerts(@Req() req: any) {
    return this.adminDashboard.alerts(req.user?.email || 'unknown');
  }

  @Get('partners')
  partners(@Req() req: any) {
    return this.adminDashboard.partners(req.user?.email || 'unknown');
  }
}
