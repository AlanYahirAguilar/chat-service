import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ContactEntity } from './entity/contact.entity';
import { MessageHistoryEntity, MessageStatus } from './entity/message-history.entity';
import { CustomLoggerService } from '@syncslot/shared';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MessageDispatcherService {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepository: Repository<ContactEntity>,
    @InjectRepository(MessageHistoryEntity)
    private readonly historyRepository: Repository<MessageHistoryEntity>,
    @Inject('IA_SERVICE') private readonly iaServiceClient: ClientProxy,
    @Inject('WHATSAPP_SERVICE') private readonly whatsappServiceClient: ClientProxy,
    @Inject('MAIL_SERVICE') private readonly mailServiceClient: ClientProxy,
    @Inject('TELEGRAM_SERVICE') private readonly telegramServiceClient: ClientProxy,
    private readonly logger: CustomLoggerService,
  ) {}

  async dispatchMessage(contactId: string, prompt: string) {
    this.logger.log(`Iniciando orquestación de mensaje para contacto ${contactId}`, 'DISPATCHER');
    
    // 1. Buscar contacto
    const contact = await this.contactRepository.findOne({ where: { id: contactId } });
    if (!contact) {
      throw new RpcException('El contacto especificado no existe.');
    }

    // 2. Crear historial PENDING
    let history = this.historyRepository.create({
      contact,
      prompt,
      status: MessageStatus.PENDING,
    });
    history = await this.historyRepository.save(history);

    try {
      // 3. Generar texto con Gemini (ia-service)
      this.logger.log(`Solicitando redacción a Gemini con tono [${contact.tone}]`, 'DISPATCHER');
      const iaResponse = await firstValueFrom(
        this.iaServiceClient.send({ cmd: 'generateMessage' }, { prompt, tone: contact.tone })
      );

      const generatedMessage = iaResponse.message;
      if (!generatedMessage) {
        throw new Error('La IA no generó ningún mensaje.');
      }

      history.generatedMessage = generatedMessage;
      await this.historyRepository.save(history);

      // 4. Enviar a través de la plataforma correspondiente
      this.logger.log(`Despachando mensaje generado vía ${contact.platform}`, 'DISPATCHER');
      let dispatchResult;

      if (contact.platform === 'WHATSAPP') {
        dispatchResult = await firstValueFrom(
          this.whatsappServiceClient.send({ cmd: 'sendMessage' }, {
            phone: contact.contactInfo,
            message: generatedMessage,
          })
        );
      } else if (contact.platform === 'MAIL') {
        dispatchResult = await firstValueFrom(
          this.mailServiceClient.send({ cmd: 'sendMail' }, {
            to: contact.contactInfo,
            body: generatedMessage,
          })
        );
      } else if (contact.platform === 'TELEGRAM') {
        dispatchResult = await firstValueFrom(
          this.telegramServiceClient.send({ cmd: 'sendMessage' }, {
            phoneOrUsername: contact.contactInfo,
            message: generatedMessage,
          })
        );
      } else {
        throw new Error(`Plataforma no soportada: ${contact.platform}`);
      }

      if (dispatchResult && dispatchResult.success === false) {
        throw new Error(dispatchResult.error || 'Fallo desconocido en el servicio de mensajería');
      }

      // 5. Marcar como EXITOSO
      history.status = MessageStatus.SENT;
      await this.historyRepository.save(history);

      this.logger.log(`Mensaje enviado y registrado exitosamente (Historial ID: ${history.id})`, 'DISPATCHER');
      return { success: true, historyId: history.id, message: generatedMessage };
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error en el orquestador: ${err.message}`, err.stack, 'DISPATCHER');
      
      // 6. Marcar como FALLIDO
      history.status = MessageStatus.FAILED;
      history.errorReason = err.message;
      await this.historyRepository.save(history);

      throw new RpcException(`Falló el envío del mensaje: ${err.message}`);
    }
  }
}
