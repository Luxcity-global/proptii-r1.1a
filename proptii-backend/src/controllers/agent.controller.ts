import { Controller, Get, Post, Body, Put, Param, Delete, HttpCode } from '@nestjs/common';
import { AgentService } from '../services/agent.service';
import { CreateAgentDto, UpdateAgentDto } from '../dtos/agent.dto';
import { Agent } from '../entities/agent.entity';

@Controller('api/agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() createAgentDto: CreateAgentDto): Promise<Agent> {
    return await this.agentService.create(createAgentDto);
  }

  @Get()
  async findAll(): Promise<Agent[]> {
    return await this.agentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Agent> {
    return await this.agentService.findOne(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<Agent> {
    const agent = await this.agentService.findByEmail(email);
    if (!agent) {
      return null;
    }
    return agent;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ): Promise<Agent> {
    return await this.agentService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.agentService.remove(id);
  }
} 