import { Controller, Post, Body, Req } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtUser } from './strategies/jwt.strategy';
export interface RequestWithUser extends Request {
  user: JwtUser; // Now req.user has id and role
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  logout(@Req() req:RequestWithUser) {
    const user=req.user
    return this.authService.logout(req.user.id);
  }

}
