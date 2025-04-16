import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  bedrooms: number;

  @Column()
  bathrooms: number;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}