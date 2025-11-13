import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { InjectRepository } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { Repository } from 'typeorm';
import { uuidv4, ZodUUID } from 'zod';

type UploadResponse = {
  upload_id: ZodUUID;
  status: 'processing' | 'completed' | 'failed';
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
    const uploadId = uuidv4();

    let csvRecords: any[];

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

    for (const record of csvRecords) {
      // TODO fazer validação aqui
      const prescription = this.prescriptionRepository.create(record);
      const prescriptionExists = await this.checkIfIDAlreadExists(record.id);

      if (!prescriptionExists) {
        this.prescriptionRepository.save(prescription);
      }
    };

    // TODO falta implementar
    return {
      upload_id: uploadId,
      status: 'processing',
      total_records: 0,
      processed_records: 0,
      valid_records: 0,
      errors: [],
    };
  }

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
