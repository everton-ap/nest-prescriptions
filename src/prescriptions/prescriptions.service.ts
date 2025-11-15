import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { InjectRepository } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { FailedRecord } from './entities/failed-record.entity';
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
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(FailedRecord)
    private readonly failedRecordRepository: Repository<FailedRecord>
  ) {}

  async create(prescriptionCsvData: string): Promise<UploadResponse> {
    const uploadId = uuidv4();
    let csvRecords: Record<string, any>[];

    try {
      csvRecords = this.parseCsvRecords(prescriptionCsvData);
    } catch (error) {
      throw error;
    }

    // 1. Buscar TODOS os IDs existentes de uma vez (otimização de performance)
    const idsToCheck = csvRecords.map(r => r.id).filter(Boolean);
    const existingPrescriptions = await this.prescriptionRepository
      .createQueryBuilder('p')
      .select('p.id')
      .where('p.id IN (:...ids)', { ids: idsToCheck })
      .getMany();

    const existingIds = new Set(existingPrescriptions.map(p => p.id));

    // 2. Processar registros e acumular em lotes
    const validPrescriptions: any[] = [];
    const failedRecords: any[] = [];
    const errors: UploadError[] = [];

    for (let i = 0; i < csvRecords.length; i++) {
      const record = csvRecords[i];
      const validatedRecord = PrescriptionSchema.safeParse(record);

      if (!validatedRecord.success) {
        validatedRecord.error.issues.forEach((err) => {
          const fieldName = err.path[0];
          const errorValue = fieldName && typeof fieldName === 'string' ? record[fieldName] : record;

          const uploadError = {
            line: i + 2, // +2 pelo index começar em 0 e o cabeçalho ser considerado a primeira linha
            field: err.path.join('.'),
            message: err.message,
            value: errorValue,
          };

          errors.push(uploadError);

          // Acumula erro para salvar em lote
          failedRecords.push({
            upload_id: uploadId,
            line: uploadError.line,
            field: uploadError.field,
            message: uploadError.message,
            value: JSON.stringify(errorValue),
          });
        });

        continue;
      }

      // Verificação em memória (O(1) vs O(n) query)
      if (existingIds.has(validatedRecord.data.id)) {
        const uploadError = {
          line: i + 2,
          field: 'id',
          message: `ID já registrado no banco`,
          value: validatedRecord.data.id,
        };

        errors.push(uploadError);

        failedRecords.push({
          upload_id: uploadId,
          line: uploadError.line,
          field: uploadError.field,
          message: uploadError.message,
          value: JSON.stringify(uploadError.value),
        });
      } else {
        validPrescriptions.push(validatedRecord.data);
      }
    }

    // 3. Persistir em LOTE (bulk insert) - muito mais eficiente
    if (failedRecords.length > 0) {
      await this.failedRecordRepository
        .createQueryBuilder()
        .insert()
        .values(failedRecords)
        .execute();
    }

    if (validPrescriptions.length > 0) {
      await this.prescriptionRepository
        .createQueryBuilder()
        .insert()
        .values(validPrescriptions)
        .execute();
    }

    return {
      upload_id: uploadId,
      status: 'completed',
      total_records: csvRecords.length,
      processed_records: csvRecords.length,
      valid_records: validPrescriptions.length,
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
      throw new BadRequestException(`Campos obrigatórios ausentes no cabeçalho: ${missingFields.join(', ')}`);
    }

    return csvRecords;
  }

}
