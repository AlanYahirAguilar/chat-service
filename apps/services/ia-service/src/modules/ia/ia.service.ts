import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateDescriptionDto } from './model/generate.description.dto';
import { GenerateMessageDto } from './model/generate.message.dto';
import { CustomLoggerService } from '@chat-monorepo/shared';
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
   * Genera el texto final de un mensaje aplicando un tono específico.
   * El usuario solo expresa el INTENT (ej: "dile que mañana hay reunión a las 9");
   * la IA autocompleta la redacción con el TONO registrado del contacto.
   * Para el canal MAIL además genera un asunto (subject).
   */
  async generateMessage(
    dto: GenerateMessageDto,
  ): Promise<{ message: string; subject: string | null }> {
    try {
      const isMail = dto.channel === 'MAIL';
      this.logger.log(
        `Generando mensaje. Tono: [${dto.tone}] Canal: [${dto.channel || 'GENERICO'}]`,
        'IA',
      );

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent`;

      const signaturePrompt = dto.userName
        ? `\nAl final del mensaje, debes incluir obligatoriamente la firma: "— Mensaje enviado por ${dto.userName}${dto.userEmail ? ` (Correo: ${dto.userEmail}` : ''}${dto.userPhone ? `, Tel: ${dto.userPhone}` : ''}${dto.userEmail || dto.userPhone ? ')' : ''}".`
        : '';

      const systemPrompt = isMail
        ? `Actúa como un asistente que redacta CORREOS ELECTRÓNICOS. A partir de la ORDEN del usuario, redacta un correo completo aplicando el TONO indicado. Devuelve EXCLUSIVAMENTE un objeto JSON válido con las claves "subject" (asunto breve y claro) y "body" (cuerpo del correo, sin la línea de asunto). No incluyas explicaciones ni markdown.\nORDEN: ${dto.prompt}\nTONO: ${dto.tone}${signaturePrompt}`
        : `Actúa como un asistente virtual redactando mensajes. Redacta el mensaje basándote en la ORDEN y aplica este TONO. Responde SOLO con el texto final, sin explicaciones ni saludos propios de la IA.\nORDEN: ${dto.prompt}\nTONO: ${dto.tone}${signaturePrompt}`;

      const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: systemPrompt }] }],
      };
      if (isMail) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        throw new Error('La API de Gemini no retornó contenido válido.');
      }

      if (isMail) {
        const parsed = this.parseMailJson(rawText);
        return {
          subject: parsed.subject,
          message: parsed.body,
        };
      }

      return { message: rawText.trim(), subject: null };
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

  /**
   * Parsea la respuesta JSON de Gemini para correos de forma tolerante:
   * limpia posibles bloques de código markdown y provee valores por defecto.
   */
  private parseMailJson(raw: string): { subject: string; body: string } {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const obj = JSON.parse(cleaned);
      const subject =
        typeof obj.subject === 'string' && obj.subject.trim()
          ? obj.subject.trim()
          : 'Nuevo mensaje';
      const bodyText =
        typeof obj.body === 'string' && obj.body.trim()
          ? obj.body.trim()
          : cleaned;
      return { subject, body: bodyText };
    } catch {
      this.logger.error(
        '[parseMailJson] No se pudo parsear el JSON del correo, intentando con regex.',
        undefined,
        'IA',
      );
      // Fallback: extraer de manera manual con regex
      const subjectMatch = cleaned.match(/"subject"\s*:\s*"([^"]+)"/i);
      // Extrae desde el inicio del body hasta la última comilla antes de la llave, o hasta el final si faltó la llave
      const bodyMatch = cleaned.match(/"body"\s*:\s*"([\s\S]*?)"(?:\s*}|\s*$)/i);

      const subject = subjectMatch ? subjectMatch[1].replace(/\\n/g, '').trim() : 'Nuevo mensaje';
      let body = bodyMatch ? bodyMatch[1] : cleaned;

      // Si el regex estricto falló, intentar extraer todo lo que sigue después de "body": "
      if (!bodyMatch) {
        const startIdx = cleaned.indexOf('"body"');
        if (startIdx !== -1) {
          const colonIdx = cleaned.indexOf(':', startIdx);
          if (colonIdx !== -1) {
            const firstQuote = cleaned.indexOf('"', colonIdx);
            if (firstQuote !== -1) {
              let extracted = cleaned.substring(firstQuote + 1);
              // quitar la ultima comilla y la posible llave de cierre si están truncadas
              extracted = extracted.replace(/"\s*}?\s*$/, '');
              body = extracted;
            }
          }
        }
      }

      // Limpiar escapes de JSON
      body = body.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

      return { subject, body };
    }
  }
}
