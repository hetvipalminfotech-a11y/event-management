import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // CREATE USER
  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
    });

    return this.userRepo.save(user);
  }

  // GET ALL USERS
  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      select: ['id', 'name', 'email', 'role', 'status', 'created_at', 'updated_at'],
    });
  }

  // GET ONE USER BY ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // UPDATE USER ROLE OR STATUS
 async update(id: number, dto: UpdateUserDto): Promise<User> {

  const user = await this.userRepo.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  Object.assign(user, dto);

  return this.userRepo.save(user);
}

  // DELETE USER
  async remove(id: number): Promise<{ message: string }> {

  const user = await this.userRepo.findOne({ where: { id } });

  if (!user) throw new NotFoundException('User not found');

  user.status = false;

  await this.userRepo.save(user);

  return { message: 'User deactivated successfully' };
}
}