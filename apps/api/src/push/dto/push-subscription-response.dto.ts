import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PushPublicKeyResponseDto {
  @ApiProperty({ nullable: true, type: String })
  publicKey!: string | null;

  @ApiProperty({
    description: 'Whether VAPID is configured so clients can subscribe',
  })
  enabled!: boolean;
}

export class PushSubscriptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  endpoint!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ nullable: true, type: String })
  deviceLabel!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  lastUsedAt!: string | null;
}

export class PushStatusResponseDto {
  @ApiProperty()
  configured!: boolean;

  @ApiProperty()
  hasActiveSubscription!: boolean;

  @ApiProperty()
  activeDeviceCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    type: Boolean,
    description: 'Present when an endpoint query param was provided',
  })
  endpointActive!: boolean | null;
}

export class PushDispatchResultDto {
  @ApiProperty()
  processed!: number;

  @ApiProperty()
  sent!: number;

  @ApiProperty()
  invalidRemoved!: number;

  @ApiProperty()
  transientFailures!: number;

  @ApiProperty()
  finalFailures!: number;
}
