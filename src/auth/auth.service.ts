import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,

    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // REGISTER
  async register(dto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.VENDOR,
    });
    return this.userRepo.save(user);
  }

  // LOGIN
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.lock_until && user.lock_until > new Date()) {
      throw new UnauthorizedException(
        'Account locked due to multiple failed login attempts',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      user.login_attempts += 1;
      if (user.login_attempts >= 5) {
        user.lock_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // reset attempts
    user.login_attempts = 0;
    user.lock_until = null;
    await this.userRepo.save(user);

    // JWT payload (sub must be string!)
    const payload: JwtPayload = {
      sub: user.id.toString(),
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') ,
      expiresIn: parseInt(this.configService.get<string>('JWT_ACCESS_EXPIRES')!) , // "1h"
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRES')!), // "7d"
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const refresh = this.refreshRepo.create({
      token_hash: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user,
    });
    await this.refreshRepo.save(refresh);

    return { accessToken, refreshToken };
  }

  // REFRESH TOKEN
  async refreshToken(token: string) {
    const payload = this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    // Convert sub back to number for DB
    const userId = parseInt(payload.sub, 10);

    const tokens = await this.refreshRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    for (const storedToken of tokens) {
      const match = await bcrypt.compare(token, storedToken.token_hash);
      if (match) {
        const newAccess = this.jwtService.sign(payload, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: parseInt(this.configService.get<string>('JWT_ACCESS_EXPIRES')!),
        });
        return { accessToken: newAccess };
      }
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  // LOGOUT
  async logout(userId: number) {
    await this.refreshRepo.delete({ user: { id: userId } });
    return { message: 'Logged out successfully' };
  }
}