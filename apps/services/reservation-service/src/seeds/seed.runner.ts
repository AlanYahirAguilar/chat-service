import { SeedDataSource } from './data-source.seed';
import { ResourceSeeder } from './seeders/03.resource.seeder';
import { ReservationSeeder } from './seeders/04.reservation.seeder';

async function runSeeds(): Promise<void> {
  console.log('🌱 Initializing reservation-service seed runner...\n');

  const dataSource = await SeedDataSource.initialize();
  console.log('✓ Database connection established\n');

  try {
    const seeders = [
      new ResourceSeeder(),
      new ReservationSeeder(),
    ];

    for (const seeder of seeders) {
      console.log(`▶  Running: ${seeder.constructor.name}`);
      await seeder.run(dataSource);
      console.log(`✓  Completed: ${seeder.constructor.name}\n`);
    }

    console.log('✅  All seeds completed successfully!');
  } catch (error) {
    console.error('\n❌  Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('\nDatabase connection closed.');
  }
}

runSeeds();
