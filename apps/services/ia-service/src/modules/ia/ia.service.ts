import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateDescriptionDto } from './model/generate.description.dto';
import { GenerateMessageDto } from './model/generate.message.dto';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class IaService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;
  private apiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY no está configurada.',
      );
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.defaultModel =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
  }
  /**
   * Genera una descripción detallada usando instrucciones de sistema opcionales dinámicas
   */
  async generateDescription(
    dto: GenerateDescriptionDto,
  ): Promise<{ description: string }> {
    try {
      this.logger.log(
        'Generando descripción para query: "' + dto.query + '"',
        'IA',
      );
      const systemInstruction =
        dto.systemInstruction ||
        'Eres un asistente de inteligencia artificial profesional e instructivo. Genera una descripción clara y detallada del tema provisto en formato Markdown.';
      const responseModel = this.genAI.getGenerativeModel({
        model: this.defaultModel,
        systemInstruction: systemInstruction,
      });
      const result = await responseModel.generateContent(dto.query);
      const responseText = result.response.text();
      return { description: responseText };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        '[generateDescription] Error generando descripción con IA: ' +
          errorMessage,
        errorStack,
        'IA',
      );
      throw new InternalServerErrorException(
        'Error generando descripción con IA.',
      );
    }
  }

  /**
   * Genera el texto final de un mensaje aplicando un tono específico
   * (Basado en la instrucción cURL usando fetch HTTP)
   */
  async generateMessage(dto: GenerateMessageDto): Promise<{ message: string }> {
    try {
      this.logger.log(`Generando mensaje. Tono: [${dto.tone}]`, 'IA');

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
      const systemPrompt = `Actúa como un asistente virtual redactando mensajes. Redacta el mensaje basándote en la ORDEN y aplica este TONO. Responde SOLO con el texto final, sin explicaciones ni saludos propios de la IA.\nORDEN: ${dto.prompt}\nTONO: ${dto.tone}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const finalMessage =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!finalMessage) {
        throw new Error('La API de Gemini no retornó contenido válido.');
      }

      return { message: finalMessage.trim() };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        '[generateMessage] Error generando mensaje con IA: ' + errorMessage,
        errorStack,
        'IA',
      );
      throw new RpcException('Error generando el mensaje. Intenta más tarde.');
    }
  }
}
