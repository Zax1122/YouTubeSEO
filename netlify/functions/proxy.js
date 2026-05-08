exports.handler = async function (event) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { service, endpoint, params, geminiContents } = body;

  try {
    // ── YouTube ──────────────────────────────────────────────
    if (service === 'youtube') {
      if (!YOUTUBE_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: { message: 'YOUTUBE_API_KEY not set in Netlify environment variables.' } }) };

      const url = new URL(`https://www.googleapis.com/youtube/v3${endpoint}`);
      url.searchParams.set('key', YOUTUBE_API_KEY);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v);
        });
      }

      const res = await fetch(url.toString());
      const data = await res.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    // ── Gemini ───────────────────────────────────────────────
    if (service === 'gemini') {
      if (!GEMINI_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: { message: 'GEMINI_API_KEY not set in Netlify environment variables.' } }) };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: geminiContents }),
        }
      );
      const data = await res.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    return { statusCode: 400, body: 'Unknown service' };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    };
  }
};
