import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('failed_records')
export class FailedRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  upload_id: string;

  @Column()
  line: number;

  @Column()
  field: string;

  @Column()
  message: string;

  @Column('text')
  value: string;

  @CreateDateColumn()
  created_at: Date;
}
