import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ViewingRequest } from './viewing-request.entity';

@Entity('Properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Column({ type: 'nvarchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  bedrooms: number;

  @Column({ type: 'int' })
  bathrooms: number;

  @Column({ type: 'nvarchar', length: 255 })
  street: string;

  @Column({ type: 'nvarchar', length: 100 })
  city: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  town: string;

  @Column({ type: 'nvarchar', length: 10 })
  postcode: string;

  @Column({ type: 'nvarchar', length: 50, default: 'available' })
  status: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  agentId: string;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updated_at: Date;

  @OneToMany(() => ViewingRequest, viewingRequest => viewingRequest.property)
  viewingRequests: ViewingRequest[];
}