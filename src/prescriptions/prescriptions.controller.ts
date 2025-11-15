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
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (_req, file, callback) => {
      // Aceita apenas CSV
      if (file.mimetype !== 'text/csv' &&
          file.mimetype !== 'application/vnd.ms-excel' &&
          !file.originalname.endsWith('.csv')) {
        return callback(
          new BadRequestException('Apenas arquivos CSV são permitidos'),
          false
        );
      }
      callback(null, true);
    },
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV não enviado');
    }

    // Validar se o arquivo não está vazio
    if (file.size === 0) {
      throw new BadRequestException('Arquivo CSV está vazio');
    }

    // Tentar converter com encoding seguro
    let csvData: string;
    try {
      csvData = file.buffer.toString('utf-8');
    } catch (error) {
      throw new BadRequestException('Erro ao ler arquivo: encoding inválido');
    }

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
