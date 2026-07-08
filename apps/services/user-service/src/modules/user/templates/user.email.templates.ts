import { stringConstants } from '@syncslot/shared';

export const sendCodeNotificationMessage = (code: string) => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #289fa7ff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">
      Código de recuperación
    </h1>
  </div>
  <div style="padding: 20px;">
    <h2 style="color: #333; margin-top: 0;">Código: ${code}</h2>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      <strong>Para recuperar su contraseña ingrese el código proporcionado en el portal ${stringConstants.APP_NAME}</strong>
    </p>
   <a href="${stringConstants.APP_URL}/verify-code" style="display: inline-block; padding: 10px 20px; background-color: #0d0d0eff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Recuperar contraseña</a> 
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">¡Gracias por usar ${stringConstants.APP_NAME}!</p>
    <p style="font-size: 14px; color: #333;">– Sistema de correos de ${stringConstants.APP_NAME}</p>
  </div>
</div>
`;

export const sendWelcomeNotificationMessage = (name: string) => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #289fa7ff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">
      ¡Bienvenido a ${stringConstants.APP_NAME}!
    </h1>
  </div>
  <div style="padding: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hola ${name},</h2>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      Tu cuenta ha sido creada exitosamente. ¡Ya puedes comenzar a gestionar tus reservas de recursos de una manera más fácil y rápida!
    </p>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      Explora la plataforma para descubrir todas las funcionalidades que tenemos para ti.
    </p>
    <a href="${stringConstants.APP_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #289fa7ff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Iniciar Sesión</a>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">¡Gracias por unirte a ${stringConstants.APP_NAME}!</p>
    <p style="font-size: 14px; color: #333;">– El equipo de ${stringConstants.APP_NAME}</p>
  </div>
</div>
`;
