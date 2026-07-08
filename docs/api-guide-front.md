<link rel="stylesheet" href="file:///C:/Users/palma/.gemini/config/skills/tech-writer/recursos/word.css">
<script type="text/javascript" async src="file:///C:/Users/palma/.gemini/config/skills/tech-writer/scripts/MathJax.js?config=TeX-MML-AM_CHTML"></script>
<script type="text/x-mathjax-config">
    MathJax.Hub.Config({ tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]} });
</script>

# Blueprint de Integración API: Ecosistema Chat Service (Orientado a Agentes Frontend)

## <span id="introduccion">1. Contexto Arquitectónico para el Frontend</span>

Este documento contiene las especificaciones técnicas exhaustivas para conectar un cliente web (React, Vue, etc.) con el API Gateway del ecosistema **Chat Service**. Está estructurado explícitamente para que un agente de IA pueda consumir los esquemas, generar el tipado estricto y construir los servicios HTTP sin ambigüedades.

- **Base URL (Gateway):** `http://localhost:4001`
- **Mecanismo de Autenticación:** Sesión basada en Cookies HTTP-Only. El frontend **no** maneja tokens JWT en memoria, solo debe asegurarse de enviar credenciales de origen cruzado (`withCredentials`).
- **Formato de Comunicación:** `application/json`

<div style="page-break-after: always;"></div>

## <span id="tipados">2. Esquemas y Tipado Estricto (TypeScript)</span>

Para garantizar una integración segura, el agente constructor debe implementar las siguientes interfaces base:

```typescript
// --- REQUEST PAYLOADS ---

export interface AuthLoginRequest {
  email: string;      // ej. admin@chat-monorepo.com
  password: string;   // ej. password123
}

export interface ChatSendRequest {
  contactId: string;  // ID numérico parseado a string (ej. "1")
  prompt: string;     // Instrucción corta (ej. "Avisa que voy tarde")
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
  message: string;    // El texto final redactado por la IA
}

export interface ApiError {
  status: number;
  message: string;
  data: null | any;
}
```

<div style="page-break-after: always;"></div>

## <span id="endpoints">3. Especificación Exhaustiva de Endpoints</span>

### <span id="auth-login">3.1. Inicio de Sesión (`POST /api/auth/login`)</span>

Encargado de autenticar al usuario y setear la cookie de sesión en el navegador.

- **Endpoint:** `http://localhost:4001/api/auth/login`
- **Headers Requeridos:** `Content-Type: application/json`
- **Payload:** Implementa `AuthLoginRequest`.
- **Comportamiento Front-end Esperado:**
  1. Si responde `200` o `201`, el cliente no necesita guardar tokens. El navegador almacenará automáticamente la cabecera `Set-Cookie`.
  2. El cliente debe actualizar su estado global a "Autenticado" y redirigir al Dashboard principal.
- **Manejo de Errores (Status `401` / `404`):**
  - Mostrar un toast o alerta indicando "Credenciales inválidas".

### <span id="chat-send">3.2. Despacho de Mensajes Inteligentes (`POST /api/chat/send`)</span>

Procesa el prompt del usuario mediante IA y despacha el mensaje hacia WhatsApp, Telegram o Correo dependiendo de la configuración del `contactId` en el backend.

- **Endpoint:** `http://localhost:4001/api/chat/send`
- **Headers Requeridos:** `Content-Type: application/json` (La cookie viaja automáticamente).
- **Payload:** Implementa `ChatSendRequest`.
- **Respuesta Exitosa (Status `201`):**
  - Devuelve un `ApiResponse<ChatSendResponseData>`.
  - El Frontend debe inyectar el campo `data.message` en la interfaz gráfica (UI de chat) para reflejar lo que la IA terminó redactando y enviando por la plataforma externa.
- **Manejo de Errores Específicos:**
  - **Status `400` (Telegram Error):** Si el contacto es de Telegram y el usuario no tiene su Chat ID numérico registrado correctamente, la API externa de Telegram rebotará el mensaje (`chat not found`). El Frontend debe capturar esto y solicitar al usuario actualizar su configuración de Telegram.
  - **Status `401`:** Indica que la sesión expiró. El cliente debe borrar la sesión local y redirigir al login obligatoriamente.

<div style="page-break-after: always;"></div>

## <span id="configuracion-cliente">4. Configuración del Cliente HTTP (Axios)</span>

El agente generador debe configurar una instancia base de Axios con las siguientes directivas para garantizar el correcto flujo de las cookies de sesión.

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:4001',
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
      // Instrucción para el agente: Limpiar estado global (Redux/Zustand)
      // y forzar redirección a /login
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);
```

<div style="page-break-after: always;"></div>

## <span id="flujo">5. Mecánica Explicativa del Flujo Completo (Backend)</span>

*(Texto puro para comprensión lógica de la orquestación)*

El ciclo de vida del proceso comienza en la vista del usuario en el Frontend. El cliente web lanza la petición al API Gateway (`/api/chat/send`), acompañando el prompt base y el identificador numérico del contacto. El Gateway valida inmediatamente que la cookie del usuario contenga un JWT firmado y vigente.

Al superar la barrera de seguridad, el Gateway actúa como enrutador y utiliza el protocolo TCP para solicitarle al microservicio central (`user-service`) la información detallada del destinatario. Este último consulta su base de datos y averigua por qué medio se debe contactar a esa persona (WhatsApp, Telegram o Mail) y cuál es el tono de voz que prefiere el usuario para este destinatario (Formal, Informal o Neutro).

Inmediatamente después, toda esta carga de contexto viaja hacia el cerebro de la aplicación (`ia-service`). Este microservicio se enlaza con la API de Gemini (Google), inyectándole el prompt inicial y pidiéndole que redacte un mensaje completo y articulado, respetando el tono estricto recuperado anteriormente. 

Una vez que Gemini escupe la obra final, se dispara el último eslabón de la cadena: el mensaje viaja al servicio despachador final (`whatsapp-service`, `telegram-service` o `mail-service`). Este módulo terminal toma el texto redactado por la IA, se apoya en la librería `open uaq` para comunicarse con las redes externas correspondientes, entrega el mensaje real al dispositivo del destinatario final y devuelve al Frontend una respuesta exitosa con el texto generado para que la interfaz pueda mostrarlo en su historial.
