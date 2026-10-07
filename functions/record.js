const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 从 Netlify 请求头里直接获取访客真实 IP
    const forwarded = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    let page = '/';
    try {
      const body = JSON.parse(event.body || '{}');
      page = body.page || '/';
    } catch (e) { /* 忽略 */ }

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
