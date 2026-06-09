import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Entity name → Supabase table name
const TABLE_MAP: Record<string, string> = {
  Staff: "staff",
  StaffInformation: "staff_information",
  BubbleOT: "bubble_ot",
  BubbleLeave: "bubble_leave",
  BubbleLeaveQuota: "bubble_leave_quota",
  BubbleClockin: "bubble_clockin",
  BubbleManHourDate: "bubble_man_hour_date",
  BubbleManHourTask: "bubble_man_hour_task",
  BubbleProject: "bubble_project",
  BubbleStaffKPI: "bubble_staff_kpi",
  BubbleStaffKPIMonth: "bubble_staff_kpimonth",
};

// Bubble entity → Bubble type name mapping
const BUBBLE_TYPE_MAP: Record<string, string> = {
  Staff: "Staff",
  StaffInformation: "Staff Information",
  BubbleOT: "OT",
  BubbleLeave: "Leave",
  BubbleLeaveQuota: "leavequota",
  BubbleClockin: "Clock-in",
  BubbleManHourDate: "Man Hour Date",
  BubbleManHourTask: "Man Hour Task",
  BubbleProject: "Project",
  BubbleStaffKPI: "Staff KPI",
  BubbleStaffKPIMonth: "Staff KPI Month",
};

// Fields known to be list/array type (per Swagger)
const LIST_FIELDS: Record<string, string[]> = {
  BubbleClockin: ["Tags - in", "Tags - out"],
};

// Display name → possible response key variants
// Bubble sometimes returns snake_case keys in list endpoint instead of display names
const RESPONSE_KEY_VARIANTS: Record<string, Record<string, string[]>> = {
  BubbleClockin: {
    "Tags - in": ["Tags - in", "tag___in_list_text", "tags___in_list_text", "tags_in_list_text", "tag_list_text", "tags_list_text"],
    "Tags - out": ["Tags - out", "tag___out_list_text", "tags___out_list_text", "tags_out_list_text"],
  },
};

/**
 * Check if a record contains a field value using any of its known key variants.
 * Bubble's list endpoint sometimes uses snake_case keys instead of display names.
 */
function findFieldInRecord(rec: Record<string, unknown>, entityName: string, bubbleField: string): { found: boolean; key: string; value: unknown } {
  // Try display name first
  if (bubbleField in rec) {
    return { found: true, key: bubbleField, value: rec[bubbleField] };
  }
  // Try known response key variants
  const variants = (RESPONSE_KEY_VARIANTS[entityName] || {})[bubbleField] || [];
  for (const variant of variants) {
    if (variant in rec) {
      return { found: true, key: variant, value: rec[variant] };
    }
  }
  // Case-insensitive fallback
  const fieldLower = bubbleField.toLowerCase().replace(/[\s\-]/g, "");
  for (const [key, val] of Object.entries(rec)) {
    const keyNorm = key.toLowerCase().replace(/[\s\-_]/g, "");
    if (keyNorm === fieldLower || keyNorm.includes(fieldLower)) {
      return { found: true, key, value: val };
    }
  }
  return { found: false, key: "", value: undefined };
}

/**
 * According to Bubble Swagger/Data API docs:
 * - Constraint query `key` uses the DISPLAY NAME (e.g. "Tags - in")
 * - Response JSON keys may use EITHER display name OR snake_case variant
 * - Bubble OMITS fields from response when they are null/empty
 * - For list (array) fields, empty = field not present in response
 *
 * Strategy:
 * 1. Use display name for constraints (correct per Swagger)
 * 2. If constraint returns count < total → constraint works, trust the count
 * 3. If count == total → verify with sample (field might genuinely be 100% filled or constraint ignored)
 * 4. Use findFieldInRecord() for verification (handles variant keys)
 * 5. Fall back to sample-based counting
 */
async function resolveActualBubbleKey(
  baseUrl: string,
  bubbleApiKey: string,
  entityName: string,
  bubbleField: string
): Promise<{ apiKey: string; dataKey: string; method: string; filledCount: number; totalRecords: number; sampleRecords: Record<string, unknown>[]; debug?: unknown }> {
  
  const displayName = bubbleField; // Per Swagger, display name IS the API key
  const isListField = (LIST_FIELDS[entityName] || []).includes(bubbleField);

  const debugInfo: Record<string, unknown> = { displayName, isListField, attempts: [] as unknown[] };

  // Get total record count first
  const totalUrl = `${baseUrl}?limit=1`;
  const totalResp = await fetch(totalUrl, {
    headers: { Authorization: `Bearer ${bubbleApiKey}` },
  });
  let totalRecords = 0;
  if (totalResp.ok) {
    const totalData = await totalResp.json();
    totalRecords = (totalData.response?.remaining || 0) + (totalData.response?.results?.length || 0);
  }
  debugInfo.totalRecords = totalRecords;

  // Strategy 1: Use "is_not_empty" with display name
  try {
    const constraints = JSON.stringify([
      { key: displayName, constraint_type: "is_not_empty" }
    ]);
    const url = `${baseUrl}?constraints=${encodeURIComponent(constraints)}&limit=10`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${bubbleApiKey}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      const remaining = data.response?.remaining || 0;
      const results = data.response?.results || [];
      const count = remaining + results.length;
      
      (debugInfo.attempts as unknown[]).push({ strategy: "is_not_empty", key: displayName, count, resultsReturned: results.length });

      // KEY INSIGHT: If count < totalRecords, the constraint IS filtering correctly.
      // We don't need to verify the field exists in response - Bubble may use different key names
      // in list endpoint vs single record endpoint.
      if (count > 0 && count < totalRecords) {
        (debugInfo.attempts as unknown[]).push({ note: "count < total, constraint is working" });
        return { 
          apiKey: displayName, 
          dataKey: displayName, 
          method: `is_not_empty(${displayName})_count_based`, 
          filledCount: count, 
          totalRecords, 
          sampleRecords: results, 
          debug: debugInfo 
        };
      }
      
      if (count > 0 && results.length > 0) {
        // count == totalRecords: verify if constraint is genuinely filtering or being ignored
        // Use findFieldInRecord which checks variant keys (Bubble may use snake_case in response)
        const hasField = results.some((r: Record<string, unknown>) => {
          const found = findFieldInRecord(r, entityName, bubbleField);
          return found.found && found.value !== null && found.value !== undefined && found.value !== "" && !(Array.isArray(found.value) && found.value.length === 0);
        });
        (debugInfo as Record<string, unknown>).hasFieldInResponse = hasField;
        
        if (hasField) {
          // Field genuinely exists in most/all records
          return { 
            apiKey: displayName, 
            dataKey: displayName, 
            method: `is_not_empty(${displayName})_verified`, 
            filledCount: count, 
            totalRecords, 
            sampleRecords: results, 
            debug: debugInfo 
          };
        }
        
        // Check with single record lookup (more detailed response)
        if (results[0]?._id) {
          const singleUrl = `${baseUrl}/${results[0]._id}`;
          const singleResp = await fetch(singleUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });
          if (singleResp.ok) {
            const singleData = await singleResp.json();
            const rec = singleData.response;
            if (rec) {
              const foundSingle = findFieldInRecord(rec, entityName, bubbleField);
              (debugInfo as Record<string, unknown>).singleRecordHasField = foundSingle.found;
              (debugInfo as Record<string, unknown>).singleRecordFoundKey = foundSingle.key;
              (debugInfo as Record<string, unknown>).singleRecordKeys = Object.keys(rec);
              
              if (foundSingle.found) {
                return { 
                  apiKey: displayName, 
                  dataKey: foundSingle.key, 
                  method: `is_not_empty(${displayName})_single_verified_key(${foundSingle.key})`, 
                  filledCount: count, 
                  totalRecords, 
                  sampleRecords: results, 
                  debug: debugInfo 
                };
              }
            }
          }
        }
        
        // count == totalRecords but can't verify field exists
        // For list fields, try "not equal []" as alternative
        if (count === totalRecords && isListField) {
          // Fall through to try "not equal []"
        } else if (count === totalRecords) {
          // Constraint might be ignored - fall through to sample counting
        }
      } else if (count === 0) {
        // No results from is_not_empty
        (debugInfo as Record<string, unknown>).isNotEmptyReturnedZero = true;
      }
    }
  } catch (e) {
    (debugInfo as Record<string, unknown>).isNotEmptyError = String(e);
  }

  // Strategy 2: For list fields, try "not equal" with empty array
  if (isListField) {
    try {
      const constraints = JSON.stringify([
        { key: displayName, constraint_type: "not equal", value: [] }
      ]);
      const url = `${baseUrl}?constraints=${encodeURIComponent(constraints)}&limit=10`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${bubbleApiKey}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const remaining = data.response?.remaining || 0;
        const results = data.response?.results || [];
        const count = remaining + results.length;
        
        (debugInfo.attempts as unknown[]).push({ strategy: "not_equal_[]", key: displayName, count });

        if (count > 0 && count < totalRecords) {
          return { 
            apiKey: displayName, 
            dataKey: displayName, 
            method: `not_equal_empty_array(${displayName})`, 
            filledCount: count, 
            totalRecords, 
            sampleRecords: results, 
            debug: debugInfo 
          };
        }
      }
    } catch (e) {
      (debugInfo as Record<string, unknown>).notEqualArrayError = String(e);
    }
  }

  // Strategy 3: Sample-based counting (most reliable fallback)
  // Fetch records from multiple offsets and check if the field exists in response
  let allSampleRecords: Record<string, unknown>[] = [];
  let filledCount = 0;
  const offsets = [0, 100, 500, 1000, 2000, 5000];
  
  for (const offset of offsets) {
    if (allSampleRecords.length >= 300) break; // Enough samples
    const sampleUrl = `${baseUrl}?limit=100&cursor=${offset}`;
    const sResp = await fetch(sampleUrl, {
      headers: { Authorization: `Bearer ${bubbleApiKey}` },
    });
    if (sResp.ok) {
      const sData = await sResp.json();
      const results = sData.response?.results || [];
      if (results.length === 0) break;
      allSampleRecords = [...allSampleRecords, ...results];
      
      for (const rec of results) {
        // Use findFieldInRecord to handle variant keys (Bubble may use snake_case)
        const found = findFieldInRecord(rec, entityName, bubbleField);
        if (found.found) {
          const val = found.value;
          // For arrays, also check it's not empty
          if (Array.isArray(val)) {
            if (val.length > 0) filledCount++;
          } else if (val !== null && val !== undefined && val !== "") {
            filledCount++;
          }
        }
      }
    }
  }

  (debugInfo as Record<string, unknown>).sampleBasedFilled = filledCount;
  (debugInfo as Record<string, unknown>).sampleBasedTotal = allSampleRecords.length;

  if (allSampleRecords.length > 0) {
    const estimatedFilled = allSampleRecords.length > 0 
      ? Math.round((filledCount / allSampleRecords.length) * totalRecords) 
      : 0;
    
    (debugInfo as Record<string, unknown>).estimatedFilled = estimatedFilled;
    
    return { 
      apiKey: displayName, 
      dataKey: displayName, 
      method: `sample_counting(${displayName}, ${filledCount}/${allSampleRecords.length} => ~${estimatedFilled})`, 
      filledCount: estimatedFilled,
      totalRecords,
      sampleRecords: allSampleRecords.filter(r => {
        const found = findFieldInRecord(r as Record<string, unknown>, entityName, bubbleField);
        if (!found.found) return false;
        const v = found.value;
        return Array.isArray(v) ? v.length > 0 : (v !== null && v !== undefined && v !== "");
      }).slice(0, 10),
      debug: debugInfo
    };
  }

  // Fallback: no data found
  return { 
    apiKey: displayName, 
    dataKey: displayName, 
    method: `no_values_found(${displayName})`, 
    filledCount: 0, 
    totalRecords, 
    sampleRecords: [], 
    debug: debugInfo 
  };
}

/**
 * Read a field value from a Bubble record.
 * Per Bubble API docs, the response key could be the display name OR a snake_case variant.
 * Bubble omits keys entirely when the value is null/empty.
 */
function readBubbleValue(rec: Record<string, unknown>, entityName: string, bubbleField: string): unknown {
  const found = findFieldInRecord(rec, entityName, bubbleField);
  return found.found ? found.value : undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const bubbleApiKey = Deno.env.get("BUBBLE_API_KEY")!;
    const bubbleAppName = Deno.env.get("BUBBLE_APP_NAME")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { entityName, dbColumn, bubbleField, sampleSize = 10 } = await req.json();

    if (!entityName || !TABLE_MAP[entityName]) {
      return new Response(
        JSON.stringify({ error: `Unknown entity: ${entityName}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tableName = TABLE_MAP[entityName];
    const bubbleType = BUBBLE_TYPE_MAP[entityName];
    const baseUrl = `https://${bubbleAppName}.bubbleapps.io/api/1.1/obj/${encodeURIComponent(bubbleType)}`;

    // Determine if this is a list field for DB counting purposes
    const isListField = (LIST_FIELDS[entityName] || []).includes(bubbleField) || dbColumn.includes("tags") || dbColumn.includes("_list");

    // Step 0: Resolve the actual Bubble API key for this field and get Bubble filled count
    const resolved = await resolveActualBubbleKey(baseUrl, bubbleApiKey, entityName, bubbleField);
    const { dataKey: resolvedDataKey, method: resolveMethod, filledCount: bubbleFilledCount, totalRecords: bubbleTotalRecords, sampleRecords } = resolved;
    const bubbleEmptyCount = bubbleTotalRecords - bubbleFilledCount;

    // Extract bubble sample records from the resolved data
    const bubbleSampleRecords: Array<{bubble_id: string; value: unknown}> = [];
    for (const rec of sampleRecords.slice(0, sampleSize)) {
      const val = readBubbleValue(rec, entityName, bubbleField);
      bubbleSampleRecords.push({
        bubble_id: (rec as Record<string, unknown>)._id as string || "",
        value: val ?? null,
      });
    }

    // Step 1: Get records from DB where the field is empty/null
    let dbEmptyFilter = `${dbColumn}.is.null,${dbColumn}.eq.`;
    const { data: dbEmptyRows } = await supabase
      .from(tableName)
      .select("bubble_id, " + dbColumn)
      .or(dbEmptyFilter)
      .limit(sampleSize);

    // Also try to get rows where column is empty array (for jsonb columns)
    let dbEmptyRowsCombined = dbEmptyRows || [];
    if (isListField && dbEmptyRowsCombined.length < sampleSize) {
      const { data: emptyArrayRows } = await supabase
        .from(tableName)
        .select("bubble_id, " + dbColumn)
        .eq(dbColumn, "[]")
        .limit(sampleSize - dbEmptyRowsCombined.length);
      if (emptyArrayRows && emptyArrayRows.length > 0) {
        dbEmptyRowsCombined = [...dbEmptyRowsCombined, ...emptyArrayRows];
      }
    }

    // Step 2: Get records from DB where the field has value
    const { data: dbFilledRows } = await supabase
      .from(tableName)
      .select("bubble_id, " + dbColumn)
      .not(dbColumn, "is", null)
      .neq(dbColumn, "")
      .limit(sampleSize);

    // Step 3: Count DB empty vs filled
    // For JSONB array columns, we need special handling:
    // - null → empty
    // - "[]" or '[]'::jsonb → empty
    // - non-empty array → filled
    // For text columns: null or "" → empty
    let actualDbFilledCount = 0;

    if (isListField) {
      // Use RPC or raw count for JSONB arrays
      // Count records where column is NOT null AND has at least one element
      // jsonb_array_length > 0 means filled
      const { count: totalNonNull } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .not(dbColumn, "is", null);
      
      // Count empty arrays: where column = '[]'::jsonb
      // PostgREST: .eq on jsonb column with [] should work
      const { count: emptyArrayCount } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .filter(dbColumn, "eq", "[]");
      
      actualDbFilledCount = Math.max(0, (totalNonNull || 0) - (emptyArrayCount || 0));
    } else {
      const { count: dbFilledCount } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .not(dbColumn, "is", null)
        .neq(dbColumn, "");
      actualDbFilledCount = dbFilledCount || 0;
    }

    const { count: dbTotalCount } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    const dbEmptyCount = (dbTotalCount || 0) - actualDbFilledCount;

    // Step 4: Cross-reference - find records that exist in Bubble with value but DB is empty
    const crossRefSamples: Array<{bubble_id: string; bubbleValue: unknown; dbValue: unknown}> = [];

    if (dbEmptyRowsCombined && dbEmptyRowsCombined.length > 0) {
      const emptyBubbleIds = dbEmptyRowsCombined
        .filter(r => r.bubble_id)
        .map(r => r.bubble_id)
        .slice(0, 5);

      for (const bId of emptyBubbleIds) {
        try {
          const lookupUrl = `${baseUrl}/${bId}`;
          const lookupResp = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });
          if (lookupResp.ok) {
            const lookupData = await lookupResp.json();
            const rec = lookupData.response;
            if (rec) {
              const bubbleVal = readBubbleValue(rec, entityName, bubbleField);
              const dbRow = dbEmptyRowsCombined.find(r => r.bubble_id === bId);
              crossRefSamples.push({
                bubble_id: bId,
                bubbleValue: bubbleVal ?? null,
                dbValue: dbRow ? dbRow[dbColumn] : null,
              });
            }
          }
        } catch {
          // Skip individual lookup errors
        }
      }
    }

    // Step 5: Also compare some filled records to verify value consistency
    const valueMismatchSamples: Array<{bubble_id: string; bubbleValue: unknown; dbValue: unknown}> = [];

    if (dbFilledRows && dbFilledRows.length > 0) {
      const filledBubbleIds = dbFilledRows
        .filter(r => r.bubble_id)
        .map(r => r.bubble_id)
        .slice(0, 5);

      for (const bId of filledBubbleIds) {
        try {
          const lookupUrl = `${baseUrl}/${bId}`;
          const lookupResp = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });
          if (lookupResp.ok) {
            const lookupData = await lookupResp.json();
            const rec = lookupData.response;
            if (rec) {
              const bubbleVal = readBubbleValue(rec, entityName, bubbleField);
              const dbRow = dbFilledRows.find(r => r.bubble_id === bId);
              const dbVal = dbRow ? dbRow[dbColumn] : null;
              valueMismatchSamples.push({
                bubble_id: bId,
                bubbleValue: bubbleVal ?? null,
                dbValue: dbVal,
              });
            }
          }
        } catch {
          // Skip
        }
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          entityName,
          dbColumn,
          bubbleField,
          _resolvedKey: { apiKey: resolved.apiKey, dataKey: resolvedDataKey, method: resolveMethod, debug: resolved.debug },
          summary: {
            bubbleFilled: bubbleFilledCount,
            bubbleEmpty: bubbleEmptyCount,
            dbFilled: actualDbFilledCount,
            dbEmpty: dbEmptyCount,
            diff: actualDbFilledCount - bubbleFilledCount,
          },
          crossRefSamples,
          valueMismatchSamples,
          bubbleSampleRecords: bubbleSampleRecords.slice(0, sampleSize),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
