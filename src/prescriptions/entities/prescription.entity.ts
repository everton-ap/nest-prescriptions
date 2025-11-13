import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Prescription {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column()
  date: string;

  @Column()
  patienteCpf: string;

  @Column()
  doctorUf: string;

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
