import { DataSource } from 'typeorm';
import { Resource } from '../../modules/resource/entity/resource.entity';
import { Schedule } from '../../modules/resource/entity/schedule.entity';

interface ScheduleData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ResourceSeedData {
  name: string;
  description: string;
  capacity: number;
  schedules: ScheduleData[];
}

const WORKDAYS = [1, 2, 3, 4, 5]; // Monday to Friday

const RESOURCES: ResourceSeedData[] = [
  {
    name: 'Consultorio A',
    description:
      'Consultorio para medicina general y consultas de primer nivel',
    capacity: 1,
    schedules: [
      ...WORKDAYS.map((day) => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
      })),
      { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
    ],
  },
  {
    name: 'Consultorio B',
    description:
      'Consultorio para especialidades médicas y procedimientos menores',
    capacity: 1,
    schedules: [
      ...WORKDAYS.map((day) => ({
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '17:00',
      })),
      { dayOfWeek: 6, startTime: '08:00', endTime: '12:00' },
    ],
  },
  {
    name: 'Sala de Reuniones',
    description:
      'Sala equipada para reuniones de trabajo, capacitaciones y talleres',
    capacity: 10,
    schedules: [
      ...WORKDAYS.map((day) => ({
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '20:00',
      })),
    ],
  },
  {
    name: 'Cancha de Tenis',
    description:
      'Cancha de tenis techada con iluminación para uso individual o dobles',
    capacity: 4,
    schedules: [
      ...WORKDAYS.map((day) => ({
        dayOfWeek: day,
        startTime: '07:00',
        endTime: '21:00',
      })),
      { dayOfWeek: 0, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '07:00', endTime: '21:00' },
    ],
  },
  {
    name: 'Estudio de Yoga',
    description:
      'Espacio amplio para clases de yoga, meditación y actividades grupales',
    capacity: 15,
    schedules: [
      ...WORKDAYS.map((day) => ({
        dayOfWeek: day,
        startTime: '06:00',
        endTime: '22:00',
      })),
      { dayOfWeek: 0, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 6, startTime: '08:00', endTime: '14:00' },
    ],
  },
];

export class ResourceSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const resourceRepo = dataSource.getRepository(Resource);
    const scheduleRepo = dataSource.getRepository(Schedule);
    let created = 0;
    let skipped = 0;

    for (const resourceData of RESOURCES) {
      const existing = await resourceRepo.findOne({
        where: { name: resourceData.name },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const { schedules: schedulesData, ...resourceFields } = resourceData;
      const resource = await resourceRepo.save(
        resourceRepo.create(resourceFields),
      );

      const scheduleEntities = schedulesData.map((s) =>
        scheduleRepo.create({ ...s, resource }),
      );
      await scheduleRepo.save(scheduleEntities);

      console.log(
        `  → Created resource: "${resourceData.name}" (capacity: ${resourceData.capacity}, schedules: ${schedulesData.length})`,
      );
      created++;
    }

    if (skipped > 0) {
      console.log(`  → Skipped ${skipped} existing resources`);
    }
    console.log(`  → Total: ${created} resources created`);
  }
}
