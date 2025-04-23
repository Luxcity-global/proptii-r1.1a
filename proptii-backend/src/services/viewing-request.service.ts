import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViewingRequest } from '../entities/viewing-request.entity';
import { CreateViewingRequestDto, UpdateViewingRequestDto } from '../dtos/viewing-request.dto';
import { PropertyService } from './property.service';
import { AgentService } from './agent.service';

@Injectable()
export class ViewingRequestService {
  constructor(
    @InjectRepository(ViewingRequest)
    private viewingRequestRepository: Repository<ViewingRequest>,
    private propertyService: PropertyService,
    private agentService: AgentService,
  ) {}

  async create(createViewingRequestDto: CreateViewingRequestDto): Promise<ViewingRequest> {
    // Verify property and agent exist
    const property = await this.propertyService.findOne(createViewingRequestDto.property_id);
    const agent = await this.agentService.findOne(createViewingRequestDto.agent_id);

    // Check for conflicting viewings
    const conflictingViewing = await this.viewingRequestRepository.findOne({
      where: {
        viewing_date: createViewingRequestDto.viewing_date,
        viewing_time: createViewingRequestDto.viewing_time,
        property: { id: property.id }
      }
    });

    if (conflictingViewing) {
      throw new BadRequestException('This viewing slot is already booked');
    }

    const viewingRequest = this.viewingRequestRepository.create({
      ...createViewingRequestDto,
      property,
      agent,
    });

    return await this.viewingRequestRepository.save(viewingRequest);
  }

  async findAll(): Promise<ViewingRequest[]> {
    return await this.viewingRequestRepository.find({
      relations: ['property', 'agent']
    });
  }

  async findOne(id: string): Promise<ViewingRequest> {
    const viewingRequest = await this.viewingRequestRepository.findOne({
      where: { id },
      relations: ['property', 'agent']
    });

    if (!viewingRequest) {
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }

    return viewingRequest;
  }

  async findByProperty(propertyId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestRepository.find({
      where: { property: { id: propertyId } },
      relations: ['property', 'agent']
    });
  }

  async findByAgent(agentId: string): Promise<ViewingRequest[]> {
    return await this.viewingRequestRepository.find({
      where: { agent: { id: agentId } },
      relations: ['property', 'agent']
    });
  }

  async update(id: string, updateViewingRequestDto: UpdateViewingRequestDto): Promise<ViewingRequest> {
    const viewingRequest = await this.findOne(id);
    Object.assign(viewingRequest, updateViewingRequestDto);
    return await this.viewingRequestRepository.save(viewingRequest);
  }

  async remove(id: string): Promise<void> {
    const result = await this.viewingRequestRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }
  }

  async getAvailableSlots(propertyId: string, date: Date): Promise<string[]> {
    // Define available time slots (e.g., 9 AM to 5 PM, hourly)
    const availableSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Get booked slots for the property on the given date
    const bookedViewings = await this.viewingRequestRepository.find({
      where: {
        property: { id: propertyId },
        viewing_date: date
      }
    });

    const bookedSlots = bookedViewings.map(viewing => viewing.viewing_time);

    // Return available slots (excluding booked ones)
    return availableSlots.filter(slot => !bookedSlots.includes(slot));
  }
} 