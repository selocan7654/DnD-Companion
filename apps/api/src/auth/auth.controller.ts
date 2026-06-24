import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthThrottlerGuard } from '../common/guards/auth-throttler.guard';
import { AUTH_THROTTLE } from '../common/throttle/auth-throttle.constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthCookieRequest, AuthCookieResponse } from './interfaces/auth-cookie.interface';
import { AuthUser } from './interfaces/auth-user.interface';
import { REFRESH_COOKIE_NAME } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: AuthCookieResponse) {
    return this.authService.login(dto, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: AuthCookieRequest, @Res({ passthrough: true }) res: AuthCookieResponse) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    return this.authService.refresh(refreshToken, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: AuthCookieRequest, @Res({ passthrough: true }) res: AuthCookieResponse) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await this.authService.logout(refreshToken, res);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@CurrentUser() user: AuthUser) {
    return this.authService.resendVerification(user);
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto);
  }
}
