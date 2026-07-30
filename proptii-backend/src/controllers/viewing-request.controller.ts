import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ViewingRequestService } from '../services/viewing-request.service';
import { CreateViewingRequestDto, UpdateViewingRequestDto } from '../dtos/viewing-request.dto';
import { ViewingRequest } from '../entities/viewing-request.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('viewing-requests')
export class ViewingRequestController {
  constructor(private readonly viewingRequestService: ViewingRequestService) { }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Req() req: any, @Body() createViewingRequestDto: CreateViewingRequestDto): Promise<ViewingRequest> {
    const userId = req.user?.sub;
    return await this.viewingRequestService.create(createViewingRequestDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Req() req: any): Promise<ViewingRequest[]> {
    const userId = req.user?.sub;
    const email = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username || '';
    return await this.viewingRequestService.findAll(userId, email);
  }


  // Static-segment routes MUST come before generic param routes (:id)
  // to prevent NestJS from matching e.g. /property/abc123 against :id.
  @Get('property/:propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findByProperty(@Param('propertyId') propertyId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findByProperty(propertyId);
  }

  @Get('agent/:agentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findByAgent(@Param('agentId') agentId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findByAgent(agentId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string): Promise<ViewingRequest> {
    return await this.viewingRequestService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateViewingRequestDto: UpdateViewingRequestDto,
  ): Promise<ViewingRequest> {
    const existing = await this.viewingRequestService.findOne(id);
    if (!existing) {
      throw new NotFoundException('Viewing request not found');
    }
    if (existing.userId !== req.user?.sub && existing.agentId !== req.user?.sub) {
      throw new ForbiddenException('You can only modify your own viewing requests');
    }
    return await this.viewingRequestService.update(id, updateViewingRequestDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Req() req: any, @Param('id') id: string): Promise<void> {
    const existing = await this.viewingRequestService.findOne(id);
    if (!existing) {
      throw new NotFoundException('Viewing request not found');
    }
    if (existing.userId !== req.user?.sub && existing.agentId !== req.user?.sub) {
      throw new ForbiddenException('You can only delete your own viewing requests');
    }
    await this.viewingRequestService.remove(id);
  }
}