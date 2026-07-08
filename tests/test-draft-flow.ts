import * as mysql from 'mysql2/promise';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';

const TEST_EMAIL = 'admin@chat-monorepo.com';
const TEST_PASSWORD = 'password123';
const TARGET_PHONE = '+527773742556';
const TARGET_MAIL = 'alanyr107@gmail.com';
const TARGET_TELEGRAM = '5060485641'; // My user id
const BASE_URL = 'http://localhost:4001';

async function seedDatabase() {
  console.log('🌱 Preparando base de datos (Clientes Reales)...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'alan2004',
    database: 'chat_db',
  });

  try {
    const [userRows]: any = await connection.execute(
      'SELECT id FROM user WHERE email = ?',
      [TEST_EMAIL]
    );
    let userId = userRows.length > 0 ? userRows[0].id : null;
    
    if (!userId) {
      const hashedPassword = bcrypt.hashSync(TEST_PASSWORD, 10);
      const [insertUser]: any = await connection.execute(
        'INSERT INTO user (name, email, phone_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test Admin', TEST_EMAIL, '521234567890', hashedPassword, 'ADMIN', 'ACTIVE']
      );
      userId = insertUser.insertId;
    }

    const contactsToCreate = [
      { name: 'Sofi (WhatsApp)', platform: 'WHATSAPP', info: TARGET_PHONE, tone: 'FORMAL' },
      { name: 'Alan (Correo)', platform: 'MAIL', info: TARGET_MAIL, tone: 'INFORMAL' },
      { name: 'Alan (Telegram)', platform: 'TELEGRAM', info: TARGET_TELEGRAM, tone: 'NEUTRO' }
    ];

    const contactIds: Record<string, string> = {};

    for (const c of contactsToCreate) {
      const [rows]: any = await connection.execute(
        'SELECT id FROM contact WHERE contact_info = ? AND user_id = ?',
        [c.info, userId]
      );
      if (rows.length === 0) {
        const [insert]: any = await connection.execute(
          'INSERT INTO contact (name, platform, contact_info, tone, user_id) VALUES (?, ?, ?, ?, ?)',
          [c.name, c.platform, c.info, c.tone, userId]
        );
        contactIds[c.platform] = insert.insertId;
        console.log(`✅ Contacto creado: ${c.name} (${c.platform})`);
      } else {
        contactIds[c.platform] = rows[0].id;
        console.log(`✅ Contacto ya existe: ${c.name} (${c.platform})`);
      }
    }

    return { userId, contactIds };
  } finally {
    await connection.end();
  }
}

async function runTest() {
  try {
    const { contactIds } = await seedDatabase();

    console.log('\n🔐 Iniciando sesión...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) throw new Error('No se recibieron cookies en el login');
    const authHeaders = { headers: { Cookie: cookies.join('; ') } };

    // ======= FLUJO DE BORRADOR (DRAFT) PARA CORREO =======
    console.log('\n=========================================');
    console.log('🤖 1. SOLICITANDO BORRADOR DE CORREO A IA');
    console.log('=========================================');
    const draftRes = await axios.post(
      `${BASE_URL}/api/chat/draft`,
      {
        contactId: contactIds['MAIL'].toString(),
        prompt: 'Dile que su pedido de refacciones automotrices ya va en camino y llegará mañana por la tarde. Usa un tono que lo haga sentir especial.'
      },
      authHeaders
    );

    const draftData = draftRes.data.data || draftRes.data;
    console.log('✅ Borrador generado exitosamente (NO ENVIADO AÚN).');
    console.log(`\nAsunto: ${draftData.subject}`);
    console.log(`Cuerpo:\n${draftData.message}`);
    
    console.log('\n✏️ 2. SIMULANDO QUE EL USUARIO EDITA EL BORRADOR...');
    const modifiedMessage = draftData.message.replace('refacciones automotrices', 'refacciones automotrices premium') + '\n\nPD: ¡Te enviamos un cupón de descuento sorpresa en la caja!';
    
    console.log('\n🚀 3. ENVIANDO EL BORRADOR VALIDADO...');
    const sendDraftRes = await axios.post(
      `${BASE_URL}/api/chat/send-draft`,
      {
        contactId: contactIds['MAIL'].toString(),
        historyId: draftData.historyId.toString(),
        subject: draftData.subject,
        message: modifiedMessage
      },
      authHeaders
    );

    console.log('✅ ¡Borrador enviado exitosamente al correo!');
    console.log(JSON.stringify(sendDraftRes.data, null, 2));

    // ======= FLUJO AUTOMÁTICO PARA TELEGRAM =======
    console.log('\n=========================================');
    console.log('✈️ 4. ENVIANDO DIRECTO A TELEGRAM (AUTO-SEND)');
    console.log('=========================================');
    const sendTelegramRes = await axios.post(
      `${BASE_URL}/api/chat/send`,
      {
        contactId: contactIds['TELEGRAM'].toString(),
        prompt: 'Avísale que el sistema de reportes ya está online y que puede revisar el dashboard.'
      },
      authHeaders
    );
    console.log('✅ ¡Mensaje directo a Telegram enviado!');
    console.log(JSON.stringify(sendTelegramRes.data, null, 2));

    console.log('\n👀 ¡REVISA TU CORREO Y TELEGRAM!');

  } catch (error: any) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    if (error.response) {
      console.error(`STATUS: ${error.response.status}`);
      console.error(`DATA: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error);
    }
  }
}

runTest();
