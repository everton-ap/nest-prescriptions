export class CreatePrescriptionDto {
  id: string;
  date: string;
  patiente_cpf: string;
  doctor_uf: string;
  medication: string;
  controlled: boolean;
  dosage: string;
  frequency: string;
  duration: number;
  notes: string;
}
