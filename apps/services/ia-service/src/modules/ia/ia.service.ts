import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateDescriptionDto } from './model/generate.description.dto';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class IaService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;
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
    this.genAI = new GoogleGenerativeAI(apiKey);
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
}
