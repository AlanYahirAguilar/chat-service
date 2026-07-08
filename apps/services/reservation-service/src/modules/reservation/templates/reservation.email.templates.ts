import { stringConstants } from '@syncslot/shared';

export const sendReservationNotificationMessage = (message: string) => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #289fa7ff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">
      Notificación de Reserva
    </h1>
  </div>
  <div style="padding: 20px;">
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      ${message}
    </p>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">¡Gracias por usar ${stringConstants.APP_NAME}!</p>
    <p style="font-size: 14px; color: #333;">– Sistema de correos de ${stringConstants.APP_NAME}</p>
  </div>
</div>
`;

export const sendReminderNotificationMessage = (
  userName: string,
  reservationDate: string,
  resourceType: string,
  resourceName: string,
) => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #289fa7ff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">
      Recordatorio de Reserva
    </h1>
  </div>
  <div style="padding: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
    <p style="font-size: 16px; color: #666; margin-bottom: 15px;">
      Le recordamos que tiene una reserva programada con los siguientes detalles:
    </p>
    <div style="background-color: #f0f8f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>📅 Fecha y hora:</strong> ${reservationDate}
      </p>
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>🏥 Tipo de recurso:</strong> ${resourceType}
      </p>
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>🔧 Recurso:</strong> ${resourceName}
      </p>
    </div>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      Por favor, asegúrese de presentarse a tiempo. Si necesita cancelar o modificar su reserva, comuníquese con nosotros lo antes posible.
    </p>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">¡Gracias por usar ${stringConstants.APP_NAME}!</p>
    <p style="font-size: 14px; color: #333;">– Sistema de correos de ${stringConstants.APP_NAME}</p>
  </div>
</div>
`;

export const sendCancellationNotificationMessage = (
  userName: string,
  reservationDate: string,
  resourceName: string,
) => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #d9534f; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">
      Notificación de Cancelación de Reserva
    </h1>
  </div>
  <div style="padding: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
    <p style="font-size: 16px; color: #666; margin-bottom: 15px;">
      Le informamos que su reserva ha sido cancelada. A continuación, los detalles de la reserva:
    </p>
    <div style="background-color: #fcf8e3; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>📅 Fecha y hora originales:</strong> ${reservationDate}
      </p>
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>🔧 Recurso:</strong> ${resourceName}
      </p>
    </div>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      Si tiene alguna pregunta o desea reagendar, por favor, póngase en contacto con nosotros.
    </p>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">Lamentamos cualquier inconveniente.</p>
    <p style="font-size: 14px; color: #333;">– El equipo de ${stringConstants.APP_NAME}</p>
  </div>
</div>
`;

export const sendModificationNotificationMessage = (
  userName: string,
  oldReservationDate: string,
  newReservationDate: string,
  resourceName: string,
) => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #f0ad4e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">
      Notificación de Modificación de Reserva
    </h1>
  </div>
  <div style="padding: 20px;">
    <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>
    <p style="font-size: 16px; color: #666; margin-bottom: 15px;">
      Le informamos que su reserva ha sido modificada. A continuación, los detalles:
    </p>
    <div style="background-color: #fcf8e3; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>Antigua fecha:</strong> <strike>${oldReservationDate}</strike>
      </p>
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>Nueva fecha:</strong> <strong>${newReservationDate}</strong>
      </p>
      <p style="font-size: 16px; color: #333; margin: 8px 0;">
        <strong>🔧 Recurso:</strong> ${resourceName}
      </p>
    </div>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      Si tiene alguna pregunta, por favor, póngase en contacto con nosotros.
    </p>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">Gracias por su comprensión.</p>
    <p style="font-size: 14px; color: #333;">– El equipo de ${stringConstants.APP_NAME}</p>
  </div>
</div>
`;
