import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode } from '@nestjs/common';
import { PropertyService } from '../services/property.service';
import { CreatePropertyDto, UpdatePropertyDto } from '../dtos/property.dto';
import { Property } from '../entities/property.entity';

@Controller('api/properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() createPropertyDto: CreatePropertyDto): Promise<Property> {
    return await this.propertyService.create(createPropertyDto);
  }

  @Get()
  async findAll(): Promise<Property[]> {
    return await this.propertyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Property> {
    return await this.propertyService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ): Promise<Property> {
    return await this.propertyService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.propertyService.remove(id);
  }
} 