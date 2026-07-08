import { DataSource } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../../modules/reservation/entity/reservation.entity';
import { Resource } from '../../modules/resource/entity/resource.entity';

interface ReservationSeedData {
  resourceName: string;
  userEmail: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

const RESERVATIONS: ReservationSeedData[] = [
  {
    resourceName: 'Consultorio A',
    userEmail: '20233tn129@utez.edu.mx',
    startTime: new Date('2026-06-05T10:00:00'),
    endTime: new Date('2026-06-05T11:00:00'),
    status: ReservationStatus.CONFIRMED,
  },
  {
    resourceName: 'Consultorio B',
    userEmail: '20233tn139@utez.edu.mx',
    startTime: new Date('2026-06-05T14:00:00'),
    endTime: new Date('2026-06-05T15:00:00'),
    status: ReservationStatus.PENDING,
  },
  {
    resourceName: 'Sala de Reuniones',
    userEmail: '20233tn129@utez.edu.mx',
    startTime: new Date('2026-06-06T09:00:00'),
    endTime: new Date('2026-06-06T11:00:00'),
    status: ReservationStatus.CONFIRMED,
  },
  {
    resourceName: 'Cancha de Tenis',
    userEmail: '20233tn139@utez.edu.mx',
    startTime: new Date('2026-06-07T16:00:00'),
    endTime: new Date('2026-06-07T18:00:00'),
    status: ReservationStatus.CANCELLED,
  },
  {
    resourceName: 'Estudio de Yoga',
    userEmail: '20233tn129@utez.edu.mx',
    startTime: new Date('2026-06-09T07:00:00'),
    endTime: new Date('2026-06-09T08:00:00'),
    status: ReservationStatus.PENDING,
  },
  {
    resourceName: 'Estudio de Yoga',
    userEmail: '20233tn112@utez.edu.mx',
    startTime: new Date('2026-06-10T08:00:00'),
    endTime: new Date('2026-06-10T09:00:00'),
    status: ReservationStatus.CONFIRMED,
  },
  {
    resourceName: 'Cancha de Tenis',
    userEmail: '20233tn115@utez.edu.mx',
    startTime: new Date('2026-06-11T10:00:00'),
    endTime: new Date('2026-06-11T11:00:00'),
    status: ReservationStatus.CONFIRMED,
  },
];

export class ReservationSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const reservationRepo = dataSource.getRepository(Reservation);
    const resourceRepo = dataSource.getRepository(Resource);
    let created = 0;
    let skipped = 0;

    // Dummy user mapping since UserEntity is not available in this microservice
    const emailToUserId: Record<string, bigint> = {
      '20233tn129@utez.edu.mx': 1n,
      '20233tn139@utez.edu.mx': 2n,
      '20233tn112@utez.edu.mx': 3n,
      '20233tn115@utez.edu.mx': 4n,
    };

    for (const data of RESERVATIONS) {
      const resource = await resourceRepo.findOne({
        where: { name: data.resourceName },
      });
      const userId = emailToUserId[data.userEmail] || 1n;

      if (!resource) {
        console.log(
          `  ⚠ Skipping reservation: resource "${data.resourceName}" not found`,
        );
        skipped++;
        continue;
      }

      const exists = await reservationRepo.findOne({
        where: {
          startTime: data.startTime,
          resource: { id: resource.id },
          userId,
        },
        relations: ['resource'],
      });

      if (exists) {
        skipped++;
        continue;
      }

      const reservation = reservationRepo.create({
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        resource,
        userId,
      });

      await reservationRepo.save(reservation);
      console.log(
        `  → Created reservation: "${data.resourceName}" for ${data.userEmail} [${data.status}]`,
      );
      created++;
    }

    if (skipped > 0) {
      console.log(`  → Skipped ${skipped} reservations`);
    }
    console.log(`  → Total: ${created} reservations created`);
  }
}
