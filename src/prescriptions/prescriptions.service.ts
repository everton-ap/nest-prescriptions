import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { InjectRepository } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { Repository } from 'typeorm';
import { PrescriptionSchema } from './schemas/prescription.schema';
import { v4 as uuidv4 } from 'uuid';
import { PRESCRIPTION_REQUIRED_FIELDS } from './constants/prescription-fields.constant';

type StatusType = 'processing' | 'completed' | 'failed';

type UploadResponse = {
  upload_id: string;
  status: StatusType;
  total_records: number;
  processed_records: number;
  valid_records: number;
  errors: UploadError[];
}

type UploadError = {
  line: number;
  field: string;
  message: string;
  value: any;
}

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>
  ) {}

  async create(prescriptionCsvData: string): Promise<UploadResponse> {
    // Lib para geração de uuid
    const uploadId = uuidv4();

    let status: StatusType = 'processing';
    let csvRecords: Record<string, any>[];

    try {
      csvRecords = this.parseCsvRecords(prescriptionCsvData);
    } catch (error) {
      status = 'failed';

      throw error;
    }

    let errors: UploadError[] = [];
    let validRecords: number = 0;
    let processedRecords: number = 0;

    // TODO para escabilidade
    // só persistir no banco após intervalor de X registros
    for (let i = 0; i < csvRecords.length; i++) {
      processedRecords++;

      const record = csvRecords[i];
      const validatedRecord = PrescriptionSchema.safeParse(record);

      if (!validatedRecord.success) {
        validatedRecord.error.issues.forEach((err) => {
          const fieldName = err.path[0];

          // TODO criar entitade para registrar erros e ter os logs das tentativas, adicionar o uuid do processo
          errors.push({
            line: i + 2, // +2 pelo index começar em 0 e o cabeçalho ser considerado a primeira
            field: err.path.join('.'),
            message: err.message,
            value: fieldName && typeof fieldName === 'string' ? record[fieldName] : record,
          });
        });

        continue;
      }

      const prescriptionExists = await this.checkIfIdAlreadExists(validatedRecord.data.id);

      if (prescriptionExists) {
        errors.push({
          line: i + 2,
          field: 'id',
          message: `ID já registrado no banco`,
          value: validatedRecord.data.id,
        });
      } else {
        const prescription = this.prescriptionRepository.create(validatedRecord.data);
        await this.prescriptionRepository.save(prescription);
        validRecords++;
      }
    };

    status = 'completed';

    return {
      upload_id: uploadId,
      status: status,
      total_records: csvRecords.length,
      processed_records: processedRecords,
      valid_records: validRecords,
      errors: errors,
    };
  }

  /**
   * Busca uma Prescription no repositorio pelo ID
   * 
   * @param id da prescricao
   * @returns Prescription
   * @throws NotFoundException caso nao encontre
   */
  async getPrescriptionById(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id }
    });

    if (prescription === null) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    return prescription;
  }

  /**
   * Faz o parse do CSV e valida se possui todos os campos no cabecalho
   *
   * @param prescriptionCsvData string com os dados do CSV
   * @returns Array de registros parseados
   * @throws BadRequestException se houver erro no parsing ou campos faltando
   */
  private parseCsvRecords(prescriptionCsvData: string): Record<string, any>[] {
    let csvRecords: Record<string, any>[];

    try {
      csvRecords = parse(prescriptionCsvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      throw new BadRequestException('Erro ao processar o arquivo: ' + error.message);
    }

    if (!csvRecords || csvRecords.length < 1) {
      throw new BadRequestException('Arquivo CSV precisa conter cabeçalho e pelo menos uma linha de registro.');
    }

    // Valida se o CSV possui todos as colunas esperadas
    const csvFields = Object.keys(csvRecords[0]);
    const missingFields = PRESCRIPTION_REQUIRED_FIELDS.filter(field => !csvFields.includes(field));

    if (missingFields.length > 0) {
      throw new BadRequestException(`Campos obrigatórios ausentes no CSV: ${missingFields.join(', ')}`);
    }

    return csvRecords;
  }

  /**
   * Checa se já existe algum registro com esse ID no repositório
   *
   * @param prescriptionId id da prescricao
   * @returns {boolean}
   */
  private async checkIfIdAlreadExists(prescriptionId: string): Promise<boolean> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId }
    });

    if (prescription == null) {
      return false;
    }

    return true;
  }
}
