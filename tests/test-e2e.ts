import * as mysql from 'mysql2/promise';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';

const TEST_EMAIL = 'admin@chat-monorepo.com';
const TEST_PASSWORD = 'password123';
const TARGET_PHONE = '+527773742556'; // Sin espacios
const BASE_URL = 'http://localhost:4001';

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'alan2004',
    database: 'chat_db',
  });

  try {
    // 1. Insert user
    const [userRows]: any = await connection.execute(
      'SELECT id FROM user WHERE email = ?',
      [TEST_EMAIL]
    );
    let userId;
    
    if (userRows.length === 0) {
      const hashedPassword = bcrypt.hashSync(TEST_PASSWORD, 10);
      const [insertUser]: any = await connection.execute(
        'INSERT INTO user (name, email, phone_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test Admin', TEST_EMAIL, '521234567890', hashedPassword, 'ADMIN', 'ACTIVE']
      );
      userId = insertUser.insertId;
      console.log(`✅ Usuario creado (ID: ${userId})`);
    } else {
      userId = userRows[0].id;
      console.log(`✅ Usuario ya existe (ID: ${userId})`);
    }

    // 2. Insert WhatsApp contact
    const [contactRows]: any = await connection.execute(
      'SELECT id FROM contact WHERE contact_info = ?',
      [TARGET_PHONE]
    );
    let contactId;

    if (contactRows.length === 0) {
      const [insertContact]: any = await connection.execute(
        'INSERT INTO contact (name, platform, contact_info, tone, user_id) VALUES (?, ?, ?, ?, ?)',
        ['Destinatario de Prueba', 'WHATSAPP', TARGET_PHONE, 'FORMAL', userId]
      );
      contactId = insertContact.insertId;
      console.log(`✅ Contacto creado (ID: ${contactId}, Phone: ${TARGET_PHONE})`);
    } else {
      contactId = contactRows[0].id;
      console.log(`✅ Contacto ya existe (ID: ${contactId})`);
    }

    // 3. Insert Mail contact
    const TARGET_MAIL = 'alanyr107@gmail.com';
    const [mailContactRows]: any = await connection.execute(
      'SELECT id FROM contact WHERE contact_info = ?',
      [TARGET_MAIL]
    );
    let mailContactId;

    if (mailContactRows.length === 0) {
      const [insertMailContact]: any = await connection.execute(
        'INSERT INTO contact (name, platform, contact_info, tone, user_id) VALUES (?, ?, ?, ?, ?)',
        ['Alan Correo', 'MAIL', TARGET_MAIL, 'INFORMAL', userId]
      );
      mailContactId = insertMailContact.insertId;
      console.log(`✅ Contacto MAIL creado (ID: ${mailContactId}, Email: ${TARGET_MAIL})`);
    } else {
      mailContactId = mailContactRows[0].id;
      console.log(`✅ Contacto MAIL ya existe (ID: ${mailContactId})`);
    }

    // 4. Insert Telegram contact
    const [telegramContactRows]: any = await connection.execute(
      'SELECT id FROM contact WHERE platform = ? AND contact_info = ?',
      ['TELEGRAM', '@alan_yhr']
    );
    let telegramContactId;

    if (telegramContactRows.length === 0) {
      const [insertTelegramContact]: any = await connection.execute(
        'INSERT INTO contact (name, platform, contact_info, tone, user_id) VALUES (?, ?, ?, ?, ?)',
        ['Alan Telegram', 'TELEGRAM', '@alan_yhr', 'INFORMAL', userId]
      );
      telegramContactId = insertTelegramContact.insertId;
      console.log(`✅ Contacto TELEGRAM creado (ID: ${telegramContactId}, Info: @alan_yhr)`);
    } else {
      telegramContactId = telegramContactRows[0].id;
      console.log(`✅ Contacto TELEGRAM ya existe (ID: ${telegramContactId})`);
    }

    return { userId, contactId, mailContactId, telegramContactId };
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function runTest() {
  try {
    // 1. Prepara la BD
    const { contactId, mailContactId, telegramContactId } = await seedDatabase();

    // 2. Iniciar sesión
    console.log('\n🔐 Iniciando sesión...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    // Extraer las cookies del header set-cookie
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) throw new Error('No se recibieron cookies en el login');
    console.log('✅ Sesión iniciada correctamente');

    // 3. Enviar mensaje por WhatsApp
    console.log('\n🚀 Despachando mensaje por WhatsApp...');
    const sendRes = await axios.post(
      `${BASE_URL}/api/chat/send`,
      {
        contactId: contactId.toString(),
        prompt: 'Infórmale amablemente al usuario que el sistema fue actualizado con éxito y que la IA y WhatsApp ya funcionan perfectamente.'
      },
      {
        headers: {
          Cookie: cookies.join('; '),
        },
      }
    );

    console.log('✅ Petición exitosa! Respuesta del Gateway (WhatsApp):');
    console.log(JSON.stringify(sendRes.data, null, 2));

    // 4. Enviar mensaje por Correo
    console.log('\n🚀 Despachando mensaje por MAIL...');
    const sendMailRes = await axios.post(
      `${BASE_URL}/api/chat/send`,
      {
        contactId: mailContactId.toString(),
        prompt: 'Salúdalo y dile que esta es una prueba de envío de correo desde la nueva arquitectura de microservicios. Que tenga un buen día.'
      },
      {
        headers: {
          Cookie: cookies.join('; '),
        },
      }
    );

    console.log('✅ Petición exitosa! Respuesta del Gateway (MAIL):');
    console.log(JSON.stringify(sendMailRes.data, null, 2));

    // 5. Enviar mensaje por Telegram
    console.log('\n🚀 Despachando mensaje por TELEGRAM...');
    const sendTelegramRes = await axios.post(
      `${BASE_URL}/api/chat/send`,
      {
        contactId: telegramContactId.toString(),
        prompt: 'Pregúntale de manera sarcástica si ya terminó de revisar la arquitectura de los microservicios.'
      },
      {
        headers: {
          Cookie: cookies.join('; '),
        },
      }
    );

    console.log('✅ Petición exitosa! Respuesta del Gateway (TELEGRAM):');
    console.log(JSON.stringify(sendTelegramRes.data, null, 2));

    console.log('\n👀 Revisa tu correo, WhatsApp y Telegram, ¡deberías estar recibiendo los tres mensajes!');

  } catch (error: any) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    if (error.response) {
      console.error(`STATUS: ${error.response.status}`);
      console.error(`DATA: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error);
    }
  }
}

runTest();
