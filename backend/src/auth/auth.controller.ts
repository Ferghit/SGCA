import { Controller, Post, Body, Get, UseGuards, Request, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleOAuthGuard } from '../common/guards/google-oauth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Request() req: any) {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Request() req: any, @Res() res: any) {
    try {
      const result = await this.authService.googleLogin(req);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/login?token=${result.access_token}&user=${encodeURIComponent(
          JSON.stringify(result.user),
        )}`,
      );
    } catch (error: any) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorMessage = error.response?.message || error.message || 'Error al iniciar sesión con Google';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
