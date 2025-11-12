import { Injectable } from '@nestjs/common';

@Injectable()
export class PrescriptionsService {
  create(prescriptionData: string) {
    return prescriptionData;
  }
}
