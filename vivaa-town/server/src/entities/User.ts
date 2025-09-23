import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Class } from './Class';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @ManyToOne(() => Class, (classEntity) => classEntity.users, { nullable: true })
  classEntity: Class;

  @Column({ nullable: true })
  jobId: string;

  @Column({ type: 'decimal', default: 0 })
  balance: number;

  @Column({ type: 'decimal', default: 100 })
  creditScore: number;

  @Column({ type: 'decimal', default: 0 })
  totalIncome: number;

  @Column({ type: 'decimal', default: 0 })
  totalSpending: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}