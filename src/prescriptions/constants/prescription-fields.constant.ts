/**
 * Campos esperados no cabecalho do CSV de prescricoes
 */
export const PRESCRIPTION_REQUIRED_FIELDS = [
  'id',
  'date',
  'patient_cpf',
  'doctor_crm',
  'doctor_uf',
  'medication',
  'controlled',
  'dosage',
  'frequency',
  'duration',
  'notes'
] as const;

export type PrescriptionFieldName = typeof PRESCRIPTION_REQUIRED_FIELDS[number];
