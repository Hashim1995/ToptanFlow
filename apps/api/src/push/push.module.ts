import { Global, Module } from '@nestjs/common';
import { PushConfigService } from './push-config.service.js';
import { PushDispatcherService } from './push-dispatcher.service.js';
import { PushNotificationsService } from './push-notifications.service.js';
import { PushSubscriptionsService } from './push-subscriptions.service.js';
import { PushController, PushDispatchController } from './push.controller.js';

@Global()
@Module({
  controllers: [PushController, PushDispatchController],
  providers: [
    PushConfigService,
    PushSubscriptionsService,
    PushNotificationsService,
    PushDispatcherService,
  ],
  exports: [PushNotificationsService, PushConfigService],
})
export class PushModule {}
