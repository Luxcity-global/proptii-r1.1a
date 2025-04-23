import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ViewingRequest } from './viewing-request.entity';

@Entity('Properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  street: string;

  @Column({ type: 'nvarchar', length: 100 })
  city: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  town: string;

  @Column({ type: 'nvarchar', length: 10 })
  postcode: string;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updated_at: Date;

  @OneToMany(() => ViewingRequest, viewingRequest => viewingRequest.property)
  viewingRequests: ViewingRequest[];
}