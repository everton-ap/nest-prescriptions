import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/prescriptions/')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  /**
   * Persiste os dados do csv na tabela de Prescriptions
   * 
   * @param file csv de prescicoes
   * @returns 
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV não enviado');
    }

    const csvData = file.buffer.toString();

    return this.prescriptionsService.create(csvData);
  }

  /**
   * Busca uma prescricao pelo ID no banco de dados
   * 
   * @param id da prescricao
   * @returns Prescription
   */
  @Get(':id')
  async getPrescriptionById(
    @Param('id')
    id: string
  ) {
    return await this.prescriptionsService.getPrescriptionById(id);
  }
}
