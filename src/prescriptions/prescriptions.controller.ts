import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/prescriptions/')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, createPrescriptionDto: CreatePrescriptionDto) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV não enviado');
    }

    const csvData = file.buffer.toString();

    return this.prescriptionsService.create(csvData);
  }
}
