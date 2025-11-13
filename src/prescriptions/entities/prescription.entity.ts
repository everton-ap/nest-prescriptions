import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Prescription {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column()
  date: string;

  @Column()
  patient_cpf: string;

  @Column()
  doctor_crm: string;

  @Column()
  doctor_uf: string;

  @Column()
  medication: string;

  @Column()
  controlled: boolean;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column()
  duration: number;

  @Column()
  notes: string;
}
