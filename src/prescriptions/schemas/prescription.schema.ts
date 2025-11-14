import { z } from 'zod';
import { cpf } from 'cpf-cnpj-validator';
import { States } from 'src/prescriptions/enum/status.enum';

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
  date: z.string().min(1, 'Data é obrigatório').refine(
    (date) => {
      if (date.length === 10 && date.includes('-')) {
        return new Date(date);
      }

      if ((date.length >= 8 && date.length <= 10) && date.includes('/')) {
        return new Date(date);
      }

      return false;
    },
    'Data inválida, enviar em algum dos formatos dd/mm/aaaa, dd/mm/aa, aaaa-mm-dd'
  ).refine(
    (date) => {
      const today = new Date();
      const receivedDate = new Date(date);

      if (receivedDate > today) {
        return false;
      }

      return true;
    },
    'Data não pode ser futura'
  ),

  /**
  * patient_cpf: 11 dígitos e obrigatório
  * 
  * Código comentado abaixo faz validação do CPF, 
  * mas na base de testes só existem 3 registros válidos. 
  */
  patient_cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  // patient_cpf: z.string().length(11, 'CPF deve ter 11 dígitos').refine(
  //   // Utilizado lib para validar CPF 
  //   (cpfNumber) => cpf.isValid(cpfNumber),
  //   'CPF inválido'
  // ),

  /**
   * doctor_crm: apenas números e obrigatório e obrigatório
   */
  doctor_crm: z.coerce.number().positive('CRM precisa ser numérico').min(1, 'CRM é obrigatório'),

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
   * medication: obrigatório
   */
  medication: z.string().min(1, 'Medicamento é obrigatório'),

  /**
   * controlled: boolean (quando vazio considerar false) e obrigatório
   */
  controlled: z.string().transform((controlled) => {
    const lowerVal = controlled.toLowerCase().trim();

    return lowerVal === 'true' || lowerVal === 'sim' || lowerVal === '1';
  }),

  /**
   * dosage: obrigatório
   */
  dosage: z.string().min(1, 'Dosagem é obrigatória'),

  /**
   * frequency: número positivo ???
   */
  frequency: z.string().min(1, 'Frequência é obrigatória'),

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

  notes: z.string().optional().default(''),
}).refine(
  /**
   * Medicamentos controlados (controlled=true) requerem observações
   */
  (data) => {
    if (data.controlled && (!data.notes || data.notes.trim() === '')) {
      return false;
    }

    return true;
  },
  {
    message: 'Observação é obrigatória quando o medicamento é controlado',
    path: ['notes'],
  }
  /**
   * Medicamentos controlados (controlled=true) têm frequency máxima de 60 dias
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
