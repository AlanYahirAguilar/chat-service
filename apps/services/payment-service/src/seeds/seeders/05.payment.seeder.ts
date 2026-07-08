import { DataSource } from 'typeorm';
import {
  Payment,
  PaymentStatus,
} from '../../modules/payment/entity/payment.entity';
import {
  Reservation,
  ReservationStatus,
} from '../../modules/reservation/entity/reservation.entity';

interface PaymentSeedData {
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
}

const PAYMENT_CATALOG: PaymentSeedData[] = [
  {
    transactionId: 'TXN-SYCS-001-2026',
    amount: 500.0,
    status: PaymentStatus.COMPLETED,
    paymentMethod: 'CREDIT_CARD',
  },
  {
    transactionId: 'TXN-SYCS-002-2026',
    amount: 800.0,
    status: PaymentStatus.COMPLETED,
    paymentMethod: 'DEBIT_CARD',
  },
  {
    transactionId: 'TXN-SYCS-003-2026',
    amount: 450.0,
    status: PaymentStatus.PENDING,
    paymentMethod: 'CREDIT_CARD',
  },
];

export class PaymentSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const paymentRepo = dataSource.getRepository(Payment);
    const reservationRepo = dataSource.getRepository(Reservation);

    const confirmedReservations = await reservationRepo.find({
      where: { status: ReservationStatus.CONFIRMED },
      relations: ['resource', 'user'],
    });

    if (confirmedReservations.length === 0) {
      console.log('  ⚠ Skipping payments: no CONFIRMED reservations found');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (
      let i = 0;
      i < PAYMENT_CATALOG.length && i < confirmedReservations.length;
      i++
    ) {
      const payData = PAYMENT_CATALOG[i];
      const reservation = confirmedReservations[i];

      const existing = await paymentRepo.findOne({
        where: { transactionId: payData.transactionId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const payment = paymentRepo.create({
        ...payData,
        reservation,
      });

      await paymentRepo.save(payment);
      console.log(
        `  → Created payment: ${payData.transactionId} ($${payData.amount}) [${payData.status}]`,
      );
      created++;
    }

    if (skipped > 0) {
      console.log(`  → Skipped ${skipped} existing payments`);
    }
    console.log(`  → Total: ${created} payments created`);
  }
}
