import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
@Entity('users')
export class User {

        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @Column({ unique: true })
        email!: string;

        @Column()
        password!: string;

        @Column({
            type: 'enum',
            enum: UserRole,
            default: UserRole.VENDOR
        })
        role!:UserRole;

        @OneToMany(() => RefreshToken, (token) => token.user)
        refreshTokens!: RefreshToken[];

        @Column({ default: true })
        status!: boolean;
        
        @CreateDateColumn()
        created_at!: Date;
        
        @UpdateDateColumn()
        updated_at!: Date;

        @Column({ type: 'int', default: 0 })
        login_attempts!: number;

        @Column({ type: 'datetime', nullable: true })
        lock_until!: Date | null;
}
