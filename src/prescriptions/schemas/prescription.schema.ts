import { z } from 'zod';
import { cpf } from 'cpf-cnpj-validator';
import { States } from 'src/prescriptions/enum/status.enum';

/**
 * Função auxiliar para fazer parse de datas em diferentes formatos
 */
function parseDate(dateStr: string): Date {
  if (dateStr.includes('-')) {
    // Formato ISO: yyyy-mm-dd
    return new Date(dateStr);
  }

  // Formato brasileiro: dd/mm/yyyy ou dd/mm/yy
  const parts = dateStr.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
  const year = parts[2].length === 2
    ? parseInt('20' + parts[2], 10)
    : parseInt(parts[2], 10);

  return new Date(year, month, day);
}

/**
 * Schema de validação para os registros de entrada do CSV de prescrições
 */
export const PrescriptionSchema = z.object({
  /**
   * id: único no sistema e obrigatório
   */
  id: z.string().min(1, 'ID é obrigatório'),

  /**
   * date: data válida e obrigatório
   * date: não pode ser futura
   */
  date: z.string()
    .min(1, 'Data é obrigatória')
    .refine(
      (date) => {
        // Regex para validar formatos específicos
        const formatDDMMYYYY = /^\d{2}\/\d{2}\/\d{4}$/;
        const formatDDMMYY = /^\d{2}\/\d{2}\/\d{2}$/;
        const formatISO = /^\d{4}-\d{2}-\d{2}$/;

        if (!formatDDMMYYYY.test(date) && !formatDDMMYY.test(date) && !formatISO.test(date)) {
          return false;
        }

        // Valida se a data parseada é válida
        const parsedDate = parseDate(date);
        return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
      },
      'Data inválida, enviar em algum dos formatos dd/mm/aaaa, dd/mm/aa, aaaa-mm-dd'
    )
    .refine(
      (date) => {
        const parsedDate = parseDate(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Permite datas de hoje

        return parsedDate <= today;
      },
      'Data não pode ser futura'
    ),

  /**
   * patient_cpf: 11 dígitos, apenas números e CPF válido
   */
  patient_cpf: z.string()
    .length(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números')
    .refine(
      (cpfNumber) => cpf.isValid(cpfNumber),
      'CPF inválido'
    ),

  /**
   * doctor_crm: número positivo, inteiro, com no máximo 6 dígitos
   */
  doctor_crm: z.coerce.number()
    .positive('CRM precisa ser numérico')
    .int('CRM deve ser um número inteiro')
    .min(1, 'CRM é obrigatório')
    .max(999999, 'CRM inválido - máximo 6 dígitos'),

  /**
   * doctor_uf: UF válida (2 letras) e obrigatório
   */
  doctor_uf: z.coerce.string().length(2, 'UF deve ter 2 caracteres')
    .transform(uf => uf.toUpperCase())
    .refine(
      (uf) => Object.values(States).includes(uf as States),
      'UF não existe'
    ),

  /**
   * medication: obrigatório, com sanitização de espaços
   */
  medication: z.string()
    .min(1, 'Medicamento é obrigatório')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Medicamento não pode ser apenas espaços'),

  /**
   * controlled: boolean (quando vazio considerar false) e obrigatório
   */
  controlled: z.string().transform((controlled) => {
    const lowerVal = controlled.toLowerCase().trim();

    return lowerVal === 'true' || lowerVal === 'sim' || lowerVal === '1';
  }),

  /**
   * dosage: obrigatório, com sanitização de espaços
   */
  dosage: z.string()
    .min(1, 'Dosagem é obrigatória')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Dosagem não pode ser apenas espaços'),

  /**
   * frequency: obrigatório, com sanitização de espaços
   */
  frequency: z.string()
    .min(1, 'Frequência é obrigatória')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Frequência não pode ser apenas espaços'),

  /**
   * duration: duração máxima de 90 dias e obrigatório
   */
  duration: z.coerce.number().positive('Duração deve ser um número positivo')
  .min(1, 'Duração é obrigatório')
  .refine(
    (duration) => {
      return duration <= 90;
    },
    'Duração precisa ser no máximo 90 dias'
  ),

  /**
   * notes: opcional, com sanitização de HTML e espaços
   */
  notes: z.string()
    .optional()
    .default('')
    .transform(val => {
      // Remove tags HTML potencialmente perigosas e faz trim
      return val?.replace(/<[^>]*>/g, '').trim() || '';
    }),
}).refine(
  /**
   * Medicamentos controlados (controlled=true) requerem observações
   */
  (data) => {
    // notes sempre será string devido ao default(''), então validamos apenas o comprimento
    return !data.controlled || data.notes.length > 0;
  },
  {
    message: 'Observação é obrigatória quando o medicamento é controlado',
    path: ['notes'],
  }
  /**
   * Medicamentos controlados (controlled=true) têm duração máxima de 60 dias
   */
).refine(
  (data) => {
    if (data.controlled && data.duration > 60) {
      return false;
    }

    return true;
  }, {
    message: 'Remédios controlados tem duração máxima de 60 dias',
    path: ['duration'],
  }
);

export type PrescriptionInput = z.infer<typeof PrescriptionSchema>;
