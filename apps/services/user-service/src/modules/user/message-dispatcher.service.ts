import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ContactEntity } from './entity/contact.entity';
import { MessageHistoryEntity, MessageStatus } from './entity/message-history.entity';
import { CustomLoggerService } from '@chat-monorepo/shared';
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
  ) { }

  async dispatchMessage(userId: bigint, contactId: string, prompt: string) {
    this.logger.log(`Iniciando orquestación de mensaje para contacto ${contactId}`, 'DISPATCHER');

    // 1. Buscar contacto validando que pertenezca al usuario autenticado
    const contact = await this.contactRepository.findOne({
      where: { id: contactId as unknown as bigint, user: { id: userId } },
      relations: ['user'],
    });
    if (!contact) {
      throw new RpcException('El contacto no existe o no pertenece al usuario.');
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
        this.iaServiceClient.send(
          { cmd: 'generateMessage' },
          { 
            prompt, 
            tone: contact.tone, 
            channel: contact.platform,
            userName: contact.user.name,
            userEmail: contact.user.email,
            userPhone: contact.user.phoneNumber
          },
        ),
      );

      const generatedMessage = iaResponse.message;
      const generatedSubject = iaResponse.subject;
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
            subject: generatedSubject || 'Nuevo mensaje',
            body: generatedMessage,
            replyTo: contact.user.email,
            fromName: contact.user.name,
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

  async generateDraft(userId: bigint, contactId: string, prompt: string) {
    this.logger.log(`Generando borrador para contacto ${contactId}`, 'DISPATCHER');

    const contact = await this.contactRepository.findOne({
      where: { id: contactId as unknown as bigint, user: { id: userId } },
      relations: ['user'],
    });
    if (!contact) {
      throw new RpcException('El contacto no existe o no pertenece al usuario.');
    }

    let history = this.historyRepository.create({
      contact,
      prompt,
      status: MessageStatus.PENDING,
    });
    history = await this.historyRepository.save(history);

    try {
      this.logger.log(`Solicitando redacción a Gemini con tono [${contact.tone}]`, 'DISPATCHER');
      const iaResponse = await firstValueFrom(
        this.iaServiceClient.send(
          { cmd: 'generateMessage' },
          { 
            prompt, 
            tone: contact.tone, 
            channel: contact.platform,
            userName: contact.user.name,
            userEmail: contact.user.email,
            userPhone: contact.user.phoneNumber
          },
        ),
      );

      const generatedMessage = iaResponse.message;
      const generatedSubject = iaResponse.subject;
      if (!generatedMessage) {
        throw new Error('La IA no generó ningún mensaje.');
      }

      history.generatedMessage = generatedMessage;
      await this.historyRepository.save(history);

      return { 
        success: true, 
        historyId: history.id, 
        message: generatedMessage,
        subject: generatedSubject 
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error generando borrador: ${err.message}`, err.stack, 'DISPATCHER');

      history.status = MessageStatus.FAILED;
      history.errorReason = err.message;
      await this.historyRepository.save(history);

      throw new RpcException(`Falló la generación del borrador: ${err.message}`);
    }
  }

  async sendDraft(userId: bigint, contactId: string, historyId: string, message: string, subject?: string) {
    this.logger.log(`Enviando borrador validado (Historial ID: ${historyId}) para contacto ${contactId}`, 'DISPATCHER');

    const contact = await this.contactRepository.findOne({
      where: { id: contactId as unknown as bigint, user: { id: userId } },
      relations: ['user'],
    });
    if (!contact) {
      throw new RpcException('El contacto no existe o no pertenece al usuario.');
    }

    const history = await this.historyRepository.findOne({
      where: { id: historyId as unknown as bigint, contact: { id: contact.id } }
    });
    if (!history) {
      throw new RpcException('El historial no existe o no pertenece al contacto.');
    }

    try {
      // Si el usuario modificó el mensaje en la UI, actualizamos el historial
      if (history.generatedMessage !== message) {
        history.generatedMessage = message;
        await this.historyRepository.save(history);
      }

      let dispatchResult;
      if (contact.platform === 'WHATSAPP') {
        dispatchResult = await firstValueFrom(
          this.whatsappServiceClient.send({ cmd: 'sendMessage' }, {
            phone: contact.contactInfo,
            message: message,
          })
        );
      } else if (contact.platform === 'MAIL') {
        dispatchResult = await firstValueFrom(
          this.mailServiceClient.send({ cmd: 'sendMail' }, {
            to: contact.contactInfo,
            subject: subject || 'Nuevo mensaje',
            body: message,
            replyTo: contact.user.email,
            fromName: contact.user.name,
          })
        );
      } else if (contact.platform === 'TELEGRAM') {
        dispatchResult = await firstValueFrom(
          this.telegramServiceClient.send({ cmd: 'sendMessage' }, {
            phoneOrUsername: contact.contactInfo,
            message: message,
          })
        );
      } else {
        throw new Error(`Plataforma no soportada: ${contact.platform}`);
      }

      if (dispatchResult && dispatchResult.success === false) {
        throw new Error(dispatchResult.error || 'Fallo desconocido en el servicio de mensajería');
      }

      history.status = MessageStatus.SENT;
      await this.historyRepository.save(history);

      this.logger.log(`Borrador enviado exitosamente (Historial ID: ${history.id})`, 'DISPATCHER');
      return { success: true, historyId: history.id };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error enviando borrador: ${err.message}`, err.stack, 'DISPATCHER');

      history.status = MessageStatus.FAILED;
      history.errorReason = err.message;
      await this.historyRepository.save(history);

      throw new RpcException(`Falló el envío del borrador: ${err.message}`);
    }
  }
}
