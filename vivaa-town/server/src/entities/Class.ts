import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: '원' })
  currencyUnit: string;

  @Column({ type: 'decimal', default: 0 })
  treasury: number;

  @Column({ type: 'decimal', default: 0 })
  donation: number;

  @Column({ default: true })
  isItemTradeEnabled: boolean;

  @Column({ default: true })
  isBankEnabled: boolean;

  @Column({ default: true })
  isStockEnabled: boolean;

  @OneToMany(() => User, (user) => user.classEntity)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}