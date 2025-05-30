import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode, Query } from '@nestjs/common';
import { ViewingRequestService } from '../services/viewing-request.service';
import { CreateViewingRequestDto, UpdateViewingRequestDto } from '../dtos/viewing-request.dto';
import { ViewingRequest } from '../entities/viewing-request.entity';

@Controller('viewing-requests')
export class ViewingRequestController {
  constructor(private readonly viewingRequestService: ViewingRequestService) { }

  @Post()
  @HttpCode(201)
  async create(@Body() createViewingRequestDto: CreateViewingRequestDto): Promise<ViewingRequest> {
    return await this.viewingRequestService.create(createViewingRequestDto);
  }

  @Get()
  async findAll(): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ViewingRequest> {
    return await this.viewingRequestService.findOne(id);
  }

  @Get('property/:propertyId')
  async findByProperty(@Param('propertyId') propertyId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findByProperty(propertyId);
  }

  @Get('agent/:agentId')
  async findByAgent(@Param('agentId') agentId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestService.findByAgent(agentId);
  }

  /* @Get('available-slots/:propertyId')
   async getAvailableSlots(
     @Param('propertyId') propertyId: string,
     @Query('date') date: string,
   ): Promise<string[]> {
     return await this.viewingRequestService.getAvailableSlots(propertyId, new Date(date));
   }
 */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateViewingRequestDto: UpdateViewingRequestDto,
  ): Promise<ViewingRequest> {
    return await this.viewingRequestService.update(id, updateViewingRequestDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.viewingRequestService.remove(id);
  }
} 