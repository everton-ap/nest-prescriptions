import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [PrescriptionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
