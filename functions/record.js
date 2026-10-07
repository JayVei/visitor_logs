const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event) => {
  // 只允许 POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS 头（允许博客域名跨域调用）
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // 1. 通过指定的 API 获取访客 IP
    const ipRes = await fetch('https://v.api.aa1.cn/api/myip/index.php?aa1=json');
    const ipData = await ipRes.json();
    const ip = ipData.myip;

    // 2. 解析前端传来的页面路径
    let page = '/';
    try {
      const body = JSON.parse(event.body || '{}');
      page = body.page || '/';
    } catch (e) { /* 忽略 */ }

    // 3. 写入 MongoDB
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
      headers,
      body: JSON.stringify({ success: true, ip: ip })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
