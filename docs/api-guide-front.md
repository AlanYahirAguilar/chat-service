<link rel="stylesheet" href="file:///C:/Users/palma/.gemini/config/skills/tech-writer/recursos/word.css">
<script type="text/javascript" async src="file:///C:/Users/palma/.gemini/config/skills/tech-writer/scripts/MathJax.js?config=TeX-MML-AM_CHTML"></script>
<script type="text/x-mathjax-config">
    MathJax.Hub.Config({ tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]} });
</script>

# Blueprint de Integración API: Ecosistema Chat Service (Orientado a Agentes Frontend)

## <span id="introduccion">1. Contexto Arquitectónico para el Frontend</span>

Este documento contiene las especificaciones técnicas exhaustivas para conectar un cliente web (React, Vue, etc.) con el API Gateway del ecosistema **Chat Service**. Está estructurado explícitamente para que un agente de IA pueda consumir los esquemas, generar el tipado estricto y construir los servicios HTTP sin ambigüedades.

- **Base URL (Gateway):** `http://localhost:4001/api`
- **Mecanismo de Autenticación:** Sesión basada en Cookies HTTP-Only. El frontend **no** maneja tokens JWT en memoria, solo debe asegurarse de enviar credenciales de origen cruzado (`withCredentials`).
- **Formato de Comunicación:** `application/json`

<div style="page-break-after: always;"></div>

## <span id="endpoints-json">2. Mapa Completo de Endpoints (JSON)</span>

A continuación, se presenta la especificación estructurada en JSON de todos los endpoints expuestos por el API Gateway, ideal para que el agente Frontend autogenere sus llamadas.

```json
{
  "baseUrl": "http://localhost:4001/api",
  "endpoints": {
    "auth": {
      "login": {
        "method": "POST",
        "url": "/auth/login",
        "body": { "email": "string", "password": "string" },
        "validations": {
          "email": "Obligatorio, debe ser un correo válido.",
          "password": "Obligatorio, mínimo 6 caracteres."
        },
        "description": "Inicia sesión y establece la cookie HTTP-Only."
      },
      "refresh": {
        "method": "POST",
        "url": "/auth/refresh",
        "description": "Refresca la sesión actual basándose en la cookie existente."
      },
      "logout": {
        "method": "POST",
        "url": "/auth/logout",
        "description": "Destruye la cookie de sesión."
      }
    },
    "chat": {
      "send": {
        "method": "POST",
        "url": "/chat/send",
        "body": { "contactId": "string", "prompt": "string" },
        "validations": {
          "contactId": "Obligatorio, debe ser un string numérico válido.",
          "prompt": "Obligatorio, longitud entre 5 y 500 caracteres."
        },
        "description": "Procesa un prompt mediante IA y despacha el mensaje inmediatamente."
      },
      "draft": {
        "method": "POST",
        "url": "/chat/draft",
        "body": { "contactId": "string", "prompt": "string" },
        "validations": {
          "contactId": "Obligatorio.",
          "prompt": "Obligatorio, longitud entre 5 y 500 caracteres."
        },
        "description": "Genera el texto con IA pero no lo despacha, solo devuelve el borrador."
      },
      "sendDraft": {
        "method": "POST",
        "url": "/chat/send-draft",
        "body": { "draftId": "string" },
        "validations": {
          "draftId": "Obligatorio, formato UUID o string numérico."
        },
        "description": "Despacha un borrador previamente generado."
      }
    },
    "contacts": {
      "create": {
        "method": "POST",
        "url": "/contacts",
        "body": { "name": "string", "platform": "WHATSAPP|TELEGRAM|MAIL", "contact_info": "string", "tone": "FORMAL|INFORMAL|NEUTRO" },
        "validations": {
          "name": "Obligatorio, máximo 50 caracteres.",
          "platform": "Obligatorio, debe coincidir con el enum exacto.",
          "contact_info": "Obligatorio, si es Mail formato correo, si es Telegram @username o ChatID numérico, si es WhatsApp formato internacional (+52...).",
          "tone": "Obligatorio, enum exacto."
        }
      },
      "getAll": {
        "method": "GET",
        "url": "/contacts",
        "queryParams": { "page": "number (opcional)", "limit": "number (opcional)" },
        "validations": {
          "page": "Opcional, mayor o igual a 1. Default: 1.",
          "limit": "Opcional, máximo 50. Default: 10."
        }
      },
      "getById": {
        "method": "GET",
        "url": "/contacts/:id",
        "urlParams": { "id": "string" }
      },
      "update": {
        "method": "PATCH",
        "url": "/contacts/:id",
        "urlParams": { "id": "string" },
        "body": { "name": "string (opcional)", "platform": "string (opcional)", "tone": "string (opcional)", "contact_info": "string (opcional)" },
        "validations": {
          "name": "Opcional, si se envía máximo 50 caracteres."
        }
      },
      "delete": {
        "method": "DELETE",
        "url": "/contacts/:id",
        "urlParams": { "id": "string" }
      }
    },
    "users": {
      "getProfile": {
        "method": "GET",
        "url": "/users/:id/profile",
        "urlParams": { "id": "string" }
      },
      "getAll": {
        "method": "GET",
        "url": "/users"
      }
    }
  }
}
```

<div style="page-break-after: always;"></div>

## <span id="tipados">3. Esquemas y Tipado Estricto (TypeScript)</span>

```typescript
// --- REQUEST PAYLOADS ---

export interface AuthLoginRequest {
  email: string;      
  password: string;   
}

export interface ChatSendRequest {
  contactId: string;  
  prompt: string;     
}

export interface CreateContactRequest {
  name: string;
  platform: 'WHATSAPP' | 'TELEGRAM' | 'MAIL';
  contact_info: string;
  tone: 'FORMAL' | 'INFORMAL' | 'NEUTRO';
}

// --- RESPONSE PAYLOADS ---

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface ChatSendResponseData {
  success: boolean;
  historyId: string;
  message: string;    
}
```

<div style="page-break-after: always;"></div>

## <span id="configuracion-cliente">4. Configuración del Cliente HTTP (Axios)</span>

El agente generador debe configurar una instancia base de Axios con las siguientes directivas para garantizar el correcto flujo de las cookies de sesión.

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:4001/api',
  withCredentials: true, // CRÍTICO: Requerido para el envío de Cookies HTTP-Only
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor global para purgar sesión ante respuestas 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);
```

<div style="page-break-after: always;"></div>

## <span id="flujo">5. Mecánica Explicativa del Flujo Completo (Backend)</span>

*(Texto puro para comprensión lógica de la orquestación)*

El ciclo de vida del proceso comienza en la vista del usuario en el Frontend. El cliente web lanza la petición al API Gateway (por ejemplo, `/chat/send`), acompañando el prompt base y el identificador numérico del contacto. El Gateway valida inmediatamente que la cookie HTTP-Only del usuario contenga un JWT firmado y vigente.

Al superar la barrera de seguridad, el Gateway actúa como enrutador y utiliza el protocolo TCP para solicitarle al microservicio central (`user-service`) la información detallada del destinatario. Este último consulta su base de datos y averigua por qué medio se debe contactar a esa persona (WhatsApp, Telegram o Mail) y cuál es el rasgo de personalidad que prefiere el usuario (Formal, Informal o Neutro).

Inmediatamente después, toda esta carga de contexto viaja hacia el cerebro de la aplicación (`ia-service`). Este microservicio se enlaza con la API de Inteligencia Artificial (Gemini), inyectándole el prompt inicial y pidiéndole que redacte un mensaje completo y articulado, respetando rigurosamente el tono recuperado en el paso anterior. 

Una vez que la IA genera el texto final (o "draft"), se dispara el último eslabón de la cadena: el mensaje viaja al servicio despachador final (`whatsapp-service`, `telegram-service` o `mail-service`). Este módulo terminal toma el texto redactado, se apoya en librerías integradas (`open uaq`) para comunicarse de forma nativa con las redes externas correspondientes, entrega el mensaje real al dispositivo del destinatario final y devuelve al Frontend una respuesta exitosa con el texto generado para que la interfaz pueda pintarlo en pantalla.
