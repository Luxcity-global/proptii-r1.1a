import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
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
  async create(@Body() createViewingRequestDto: CreateViewingRequestDto): Promise<ViewingRequest> {
    return await this.viewingRequestService.create(createViewingRequestDto);
  }

  @Get()
  async findAll(): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findAll();
  }

  // Static-segment routes MUST come before generic param routes (:id)
  // to prevent NestJS from matching e.g. /property/abc123 against :id.
  @Get('property/:propertyId')
  async findByProperty(@Param('propertyId') propertyId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findByProperty(propertyId);
  }

  @Get('agent/:agentId')
  async findByAgent(@Param('agentId') agentId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findByAgent(agentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ViewingRequest> {
    return await this.viewingRequestService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateViewingRequestDto: UpdateViewingRequestDto,
  ): Promise<ViewingRequest> {
    return await this.viewingRequestService.update(id, updateViewingRequestDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string): Promise<void> {
    await this.viewingRequestService.remove(id);
  }
}