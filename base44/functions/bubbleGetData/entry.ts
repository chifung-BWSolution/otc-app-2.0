import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dataType, constraints, limit = 100, cursor = 0 } = body;

    if (!dataType) {
      return Response.json({ error: 'dataType is required' }, { status: 400 });
    }

    const baseUrl = Deno.env.get('BUBBLE_API_URL');
    const token = Deno.env.get('BUBBLE_API_TOKEN');

    let url = `${baseUrl}/obj/${dataType}?limit=${limit}&cursor=${cursor}`;

    if (constraints && constraints.length > 0) {
      url += `&constraints=${encodeURIComponent(JSON.stringify(constraints))}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Bubble API error: ${response.status}`, details: errText }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});