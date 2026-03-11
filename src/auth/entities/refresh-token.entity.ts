import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken  {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  token_hash!: string;

  @Column({ type: 'timestamp'})
  expiresAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ default: true })
    status!: boolean;

  @CreateDateColumn()
    created_at!: Date;

  @UpdateDateColumn()
    updated_at!: Date;
}