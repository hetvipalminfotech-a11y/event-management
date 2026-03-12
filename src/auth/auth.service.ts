import {
  Injectable,
  NotFoundException,
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
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_ACCESS_EXPIRES')!,
      ), // "1h"
    });

    // create empty refresh token record first
    const refresh = await this.refreshRepo.save(
      this.refreshRepo.create({
        token_hash: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user,
      }),
    );

    // add tokenId to payload
    const refreshPayload: JwtPayload = {
      sub: user.id.toString(),
      role: user.role,
      tokenId: refresh.id,
    };

    // generate refresh token
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_REFRESH_EXPIRES')!,
      ),
    });

    // hash refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // update record with hash
    refresh.token_hash = tokenHash;
    await this.refreshRepo.save(refresh);

    return { accessToken, refreshToken };
  }

  // REFRESH TOKEN
  async refreshToken(dto: RefreshTokenDto) {
    const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.refreshRepo.findOne({
      where: { id: payload.tokenId, status: true },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const match = await bcrypt.compare(dto.refreshToken, storedToken.token_hash);

    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccess = this.jwtService.sign(
      {
        sub: storedToken.user.id.toString(),
        role: storedToken.user.role,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: parseInt(
          this.configService.get<string>('JWT_ACCESS_EXPIRES')!,
        ),
      },
    );

    return { accessToken: newAccess };
  }

  // LOGOUT
  async logout(dto: RefreshTokenDto) {
    const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid token');
    }

    const token = await this.refreshRepo.findOne({
      where: { id: payload.tokenId, status: true },
    });

    if (!token) {
      throw new NotFoundException('Refresh token not found');
    }

    if (token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const match = await bcrypt.compare(dto.refreshToken, token.token_hash);

    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    token.status = false;

    await this.refreshRepo.save(token);

    return {
      message: 'Logout successful',
    };
  }
}
