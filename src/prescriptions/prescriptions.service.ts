import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { InjectRepository } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { Repository } from 'typeorm';
import { PrescriptionInput, PrescriptionSchema } from './schemas/prescription.schema';
import { v4 as uuidv4 } from 'uuid';

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

    let csvRecords: PrescriptionInput[];

    try {
      csvRecords = parse(prescriptionCsvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      status = 'failed';
      throw new BadRequestException('Erro ao processar o arquivo: ' + error.message);
    }

    if (!csvRecords || csvRecords.length < 1) {
      status = 'failed';
      throw new BadRequestException('Arquivo CSV precisa conter cabeçalho e pelo menos uma linha de registro.');
    }

    let errors: UploadError[] = [];
    let validRecords: number = 0;
    let processedRecords: number = 0;
    for (let i = 0; i < csvRecords.length; i++) {
      processedRecords++;
      const record = csvRecords[i];
      const validatedRecord = PrescriptionSchema.safeParse(record);

      if (!validatedRecord.success) {
        validatedRecord.error.issues.forEach((err) => {
          errors.push({
            line: i + 2, // +2 pelo index começar em 0 e o cabeçalho ser considerado a primeira
            field: err.path.join('.'),
            message: err.message,
            value: err.path.length > 0 ? record[err.path[0]] : record,
          });
        });

        continue;
      }

      const prescriptionExists = await this.checkIfIDAlreadExists(validatedRecord.data.id);

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
   * Checa se já existe algum registro com esse ID no repositório
   * 
   * @param prescriptionId 
   * @returns {boolean}
   */
  async checkIfIDAlreadExists(prescriptionId: string): Promise<boolean> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id: prescriptionId }
    });

    if (prescription == null) {
      return false;
    }

    return true;
  }
}
