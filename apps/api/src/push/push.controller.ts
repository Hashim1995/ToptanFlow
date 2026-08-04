import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { Public } from '../auth/public.decorator.js';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto.js';
import { DeletePushSubscriptionDto } from './dto/delete-push-subscription.dto.js';
import { PushStatusQueryDto } from './dto/push-status-query.dto.js';
import {
  PushDispatchResultDto,
  PushPublicKeyResponseDto,
  PushStatusResponseDto,
  PushSubscriptionResponseDto,
} from './dto/push-subscription-response.dto.js';
import { PushConfigService } from './push-config.service.js';
import { PushDispatcherService } from './push-dispatcher.service.js';
import { PushSubscriptionsService } from './push-subscriptions.service.js';

@ApiTags('Push')
@Controller('push')
export class PushController {
  constructor(
    private readonly pushConfig: PushConfigService,
    private readonly subscriptions: PushSubscriptionsService,
  ) {}

  @Get('public-key')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the VAPID public key for Web Push subscribe',
  })
  @ApiOkResponse({ type: PushPublicKeyResponseDto })
  getPublicKey(): PushPublicKeyResponseDto {
    const publicKey = this.pushConfig.getPublicKey();
    return {
      publicKey,
      enabled: this.pushConfig.isConfigured(),
    };
  }

  @Post('subscriptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert the current user push subscription' })
  @ApiOkResponse({ type: PushSubscriptionResponseDto })
  subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePushSubscriptionDto,
  ): Promise<PushSubscriptionResponseDto> {
    if (!this.pushConfig.isConfigured()) {
      throw new ServiceUnavailableException({
        message: 'Web Push is not configured on the server',
        code: 'PUSH_NOT_CONFIGURED',
      });
    }
    return this.subscriptions.upsert(user.id, dto);
  }

  @Delete('subscriptions')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable the current user push subscription' })
  unsubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeletePushSubscriptionDto,
  ): Promise<{ ok: true }> {
    return this.subscriptions.unsubscribe(user.id, dto);
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Push subscription status for the current user' })
  @ApiOkResponse({ type: PushStatusResponseDto })
  status(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PushStatusQueryDto,
  ): Promise<PushStatusResponseDto> {
    return this.subscriptions.status(user.id, query);
  }
}

@ApiTags('Push')
@Controller('push')
export class PushDispatchController {
  constructor(
    private readonly pushConfig: PushConfigService,
    private readonly dispatcher: PushDispatcherService,
  ) {}

  /**
   * Protected retry dispatcher for Vercel Cron / internal callers.
   * Authorization: `x-push-dispatch-secret` header OR
   * `Authorization: Bearer <PUSH_DISPATCH_SECRET>` (Vercel Cron friendly).
   */
  @Public()
  @Get('dispatch')
  @Post('dispatch')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Dispatch pending push deliveries (secret-protected)',
  })
  @ApiOkResponse({ type: PushDispatchResultDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing dispatch secret',
  })
  async dispatch(
    @Headers('x-push-dispatch-secret') headerSecret: string | undefined,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<PushDispatchResultDto> {
    const expected = this.pushConfig.getDispatchSecret();
    const bearer = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;
    const provided = headerSecret?.trim() || bearer;
    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException({
        message: 'Invalid push dispatch secret',
        code: 'PUSH_DISPATCH_UNAUTHORIZED',
      });
    }
    return this.dispatcher.dispatchPending();
  }
}
