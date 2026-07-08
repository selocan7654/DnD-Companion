import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireVerifiedEmail } from '../common/decorators/require-verified-email.decorator';
import { PresignRequestDto } from './dto/presign-request.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @RequireVerifiedEmail()
  @HttpCode(HttpStatus.OK)
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignRequestDto) {
    return this.uploadsService.generatePresignedUrl(dto, user.id);
  }
}
