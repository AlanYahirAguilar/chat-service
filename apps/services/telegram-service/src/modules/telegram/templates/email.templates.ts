export const sendTestNotificationMessage = () => `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  <div style="background-color: #4a6da7; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #fff; font-size: 28px; margin: 0;">Email Test Successful</h1>
  </div>
  <div style="padding: 20px; text-align: center;">
    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
      This is a test email to verify that the email system is working correctly.
    </p>
    <div style="margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #f8f9fa; border-left: 4px solid #28a745;">
      <p style="font-size: 16px; color: #28a745; margin: 0;">
        <strong>All systems operational!</strong>
      </p>
      <p style="margin-top: 10px; margin-bottom: 0;">
        Email delivery system is properly configured and functioning.
      </p>
    </div>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="font-size: 14px; color: #666;">This is an automated message from Automated Deployment System.</p>
    <p style="font-size: 14px; color: #333;">Sent at: ${new Date().toISOString()}</p>
  </div>
</div>
`;
