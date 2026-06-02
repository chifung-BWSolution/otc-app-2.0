import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_URL = Deno.env.get('BUBBLE_API_URL');
const BUBBLE_TOKEN = Deno.env.get('BUBBLE_API_TOKEN');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function bubbleFetchAll(dataType) {
  let all = [];
  let cursor = 0;
  while (true) {
    const url = `${BUBBLE_URL}/${encodeURIComponent(dataType)}?limit=100&cursor=${cursor}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${BUBBLE_TOKEN}` } });
    if (!res.ok) { console.log(`Bubble ${dataType} error: ${res.status}`); break; }
    const data = await res.json();
    const results = data.response?.results || [];
    all = all.concat(results);
    const remaining = data.response?.remaining || 0;
    if (remaining === 0 || results.length === 0) break;
    cursor += results.length;
    await sleep(300);
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const results = {};

    // ---- Sync Categories ----
    console.log('Fetching NOS Staff Q&A Category...');
    const bubbleCategories = await bubbleFetchAll('NOS Staff Q&A Category');
    console.log(`Bubble categories: ${bubbleCategories.length}`);

    const existingCats = await base44.asServiceRole.entities.StaffQACategory.list('-created_date', 500);
    const catMap = {};
    for (const c of existingCats) { if (c.bubble_id) catMap[c.bubble_id] = c; }

    let catCreated = 0, catUpdated = 0;
    const catsToCreate = [];
    const catsToUpdate = [];

    for (const r of bubbleCategories) {
      const record = {
        bubble_id: r['_id'],
        display: r['Display'] || '',
        type: r['Type'] || '',
        is_active: r['Is Active'] !== false,
        bubble_created_by: r['Created By'] || '',
        bubble_created_date: r['Created Date'] || null,
        bubble_modified_date: r['Modified Date'] || null,
      };

      const existing = catMap[r['_id']];
      if (existing) {
        if ((r['Modified Date'] || '') !== (existing.bubble_modified_date || '')) {
          catsToUpdate.push({ id: existing.id, data: record });
        }
      } else {
        catsToCreate.push(record);
      }
    }

    for (let i = 0; i < catsToCreate.length; i += 5) {
      const batch = catsToCreate.slice(i, i + 5);
      await base44.asServiceRole.entities.StaffQACategory.bulkCreate(batch);
      catCreated += batch.length;
      await sleep(1000);
    }
    for (const item of catsToUpdate) {
      await base44.asServiceRole.entities.StaffQACategory.update(item.id, item.data);
      catUpdated++;
      await sleep(500);
    }

    results.categories = {
      bubble_total: bubbleCategories.length,
      bubble_fields: ['_id', 'Display', 'Type', 'Is Active', 'Created By', 'Created Date', 'Modified Date'],
      bubble_field_count: 7,
      created: catCreated,
      updated: catUpdated,
    };
    console.log(`Categories done: created=${catCreated}, updated=${catUpdated}`);

    // ---- Sync Questions ----
    console.log('Fetching NOS Staff Q&A Question...');
    const bubbleQuestions = await bubbleFetchAll('NOS Staff Q&A Question');
    console.log(`Bubble questions: ${bubbleQuestions.length}`);

    const existingQs = await base44.asServiceRole.entities.StaffQAQuestion.list('-created_date', 1000);
    const qMap = {};
    for (const q of existingQs) { if (q.bubble_id) qMap[q.bubble_id] = q; }

    let qCreated = 0, qUpdated = 0;
    const qsToCreate = [];
    const qsToUpdate = [];

    for (const r of bubbleQuestions) {
      const record = {
        bubble_id: r['_id'],
        question: r['Question'] || '',
        category_id: r['Category'] || '',
        placeholder: r['Placeholder'] || '',
        option_1: r['Option 1'] || '',
        option_2: r['Option 2'] || '',
        option_3: r['Option 3'] || '',
        option_4: r['Option 4'] || '',
        is_option: r['Is Option'] === true,
        is_required: r['Is Required'] === true,
        is_active: r['Is Active'] !== false,
        bubble_created_by: r['Created By'] || '',
        bubble_modifier: r['Modifier'] || '',
        bubble_created_date: r['Created Date'] || null,
        bubble_modified_date: r['Modified Date'] || null,
      };

      const existing = qMap[r['_id']];
      if (existing) {
        if ((r['Modified Date'] || '') !== (existing.bubble_modified_date || '')) {
          qsToUpdate.push({ id: existing.id, data: record });
        }
      } else {
        qsToCreate.push(record);
      }
    }

    for (let i = 0; i < qsToCreate.length; i += 5) {
      const batch = qsToCreate.slice(i, i + 5);
      await base44.asServiceRole.entities.StaffQAQuestion.bulkCreate(batch);
      qCreated += batch.length;
      console.log(`Questions created: ${qCreated}/${qsToCreate.length}`);
      await sleep(1500);
    }
    for (const item of qsToUpdate) {
      await base44.asServiceRole.entities.StaffQAQuestion.update(item.id, item.data);
      qUpdated++;
      await sleep(500);
    }

    results.questions = {
      bubble_total: bubbleQuestions.length,
      bubble_fields: ['_id', 'Question', 'Category', 'Placeholder', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Is Option', 'Is Required', 'Is Active', 'Created By', 'Modifier', 'Created Date', 'Modified Date'],
      bubble_field_count: 15,
      created: qCreated,
      updated: qUpdated,
    };
    console.log(`Questions done: created=${qCreated}, updated=${qUpdated}`);

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});