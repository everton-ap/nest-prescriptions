import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './prescriptions/entities/prescription.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3307,
      username: process.env.DB_USER || 'nest',
      password: process.env.DB_PASS || 'senha',
      database: process.env.DB_NAME || 'prescriptions',
      entities: [Prescription],
      synchronize: true,
      logging: true,
    }),
    PrescriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
