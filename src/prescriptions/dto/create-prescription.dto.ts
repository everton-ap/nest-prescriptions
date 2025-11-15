export class CreatePrescriptionDto {
  id: string;
  date: string;
  patient_cpf: string;
  doctor_crm: number;
  doctor_uf: string;
  medication: string;
  controlled: boolean;
  dosage: string;
  frequency: string;
  duration: number;
  notes: string;
}
