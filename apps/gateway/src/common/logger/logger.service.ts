import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
  private readonly customColors: Record<string, string> = {
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
  };

  private readonly contextColors: Record<string, string> = {
    REQUEST: this.customColors.yellow,
    WHATSAPP: this.customColors.green,
    EXCEPTION: this.customColors.red,
    EMAIL: this.customColors.cyan,
    CLOUDFLARE: this.customColors.blue,
    MEDIA: this.customColors.magenta,
    VALIDATION: this.customColors.magenta,
  };

  protected formatContext(context: string): string {
    const color = this.contextColors[context] || this.customColors.gray;
    return `${color}[${context}]${this.customColors.reset}`;
  }
}
