import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ViewingRequest } from './viewing-request.entity';

@Entity('Agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 255 })
  email: string;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'nvarchar', length: 255 })
  company: string;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updated_at: Date;

  @OneToMany(() => ViewingRequest, viewingRequest => viewingRequest.agent)
  viewingRequests: ViewingRequest[];
} 