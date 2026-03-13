import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  action!: string;

  @Column()
  entity!: string;

  @Column()
  entity_id!: string;

  @Column({ type: 'json', nullable: true })
  old_data?: any;

  @Column({ type: 'json', nullable: true })
  new_data?: any;

  @CreateDateColumn()
  created_at!: Date;
}