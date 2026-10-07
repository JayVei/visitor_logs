const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

// 统一的 CORS 响应头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // 1. 处理浏览器的 CORS 预检请求（OPTIONS）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // 2. 只允许 POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 3. 通过指定的 API 获取访客 IP
    const ipRes = await fetch('https://v.api.aa1.cn/api/myip/index.php?aa1=json');
    const ipData = await ipRes.json();
    const ip = ipData.myip;

    // 4. 解析前端传来的页面路径
    let page = '/';
    try {
      const body = JSON.parse(event.body || '{}');
      page = body.page || '/';
    } catch (e) { /* 忽略 */ }

    // 5. 写入 MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    await client.db('test').collection('visitor_logs').insertOne({
      ip: ip,
      page: page,
      visitedAt: new Date(),
      userAgent: event.headers['user-agent'] || ''
    });

    await client.close();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, ip: ip })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message })
    };
  }
};
