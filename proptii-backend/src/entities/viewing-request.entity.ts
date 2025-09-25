import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from './property.entity';
import { Agent } from './agent.entity';

@Entity('ViewingRequests')
export class ViewingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property, property => property.viewingRequests)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Agent, agent => agent.viewingRequests)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'date' })
  viewing_date: Date;

  @Column({ type: 'time' })
  viewing_time: string;

  @Column({ type: 'nvarchar', length: 50 })
  preference: string;

  @Column({ type: 'nvarchar', length: 20, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updated_at: Date;
} 