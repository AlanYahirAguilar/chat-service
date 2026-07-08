import { Module } from '@nestjs/common';
import { IaService } from './ia.service';
import { IaController } from './ia.controller';

@Module({
  imports: [],
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
