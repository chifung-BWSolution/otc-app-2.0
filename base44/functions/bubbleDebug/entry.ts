import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = Deno.env.get('BUBBLE_API_URL');
    const token = Deno.env.get('BUBBLE_API_TOKEN');

    // Try different URL formats
    const urls = [
      `${baseUrl}/obj/Staff`,
      `${baseUrl}/Staff`,
      `${baseUrl}/obj/staff`,
    ];

    const results = [];
    for (const url of urls) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      results.push({ url, status: response.status, body: text.slice(0, 300) });
    }

    return Response.json({ baseUrl, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});