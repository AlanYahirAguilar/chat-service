import { DataSource } from 'typeorm';
import { ThemeEntity } from '../../modules/theme/entity/theme.entity';
import { Logger } from '@nestjs/common';

export default class ThemeSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const logger = new Logger('ThemeSeeder');
    const themeRepo = dataSource.getRepository(ThemeEntity);

    const defaultThemes = [
      {
        name: 'Ocean Blue (Teal)',
        primaryColor: '#14b8a6',
        secondaryColor: '#212c42',
        accentColor: '#14b8a6',
        successColor: '#10b981',
        dangerColor: '#f43f5e',
        warningColor: '#f59e0b',
        isDefault: true,
        isActive: true, // Only one can be active
      },
      {
        name: 'Midnight Rose',
        primaryColor: '#e11d48',
        secondaryColor: '#27272a',
        accentColor: '#e11d48',
        successColor: '#10b981',
        dangerColor: '#ef4444',
        warningColor: '#f59e0b',
        isDefault: true,
        isActive: false,
      },
      {
        name: 'Corporate Slate',
        primaryColor: '#0ea5e9',
        secondaryColor: '#f1f5f9',
        accentColor: '#0ea5e9',
        successColor: '#10b981',
        dangerColor: '#ef4444',
        warningColor: '#f59e0b',
        isDefault: true,
        isActive: false,
      },
    ];

    for (const data of defaultThemes) {
      const exists = await themeRepo.findOne({ where: { name: data.name } });
      if (!exists) {
        await themeRepo.save(themeRepo.create(data));
      }
    }

    logger.log('Theme seeder executed successfully');
  }
}
