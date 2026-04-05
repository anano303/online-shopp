import { Module } from '@nestjs/common';
import { EmailService } from './services/email.services';
import { TestEmailController } from './controllers/test-email.controller';
import { ContactController } from './controllers/contact.controller';

@Module({
  controllers: [TestEmailController, ContactController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
