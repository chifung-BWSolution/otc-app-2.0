const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Entity name → Bubble type name
const BUBBLE_TYPE_MAP: Record<string, string> = {
  Staff: "Staff",
  StaffInformation: "Staff Information",
  BubbleOT: "OT",
  BubbleLeave: "Leave",
  BubbleClockin: "Clock-in",
  BubbleManHourDate: "Man Hour Date",
  BubbleManHourTask: "Man Hour Task",
  BubbleProject: "Project",
  BubbleStaffKPI: "Staff KPI",
  BubbleStaffKPIMonth: "Staff KPI Month",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const bubbleApiKey = Deno.env.get("BUBBLE_API_KEY");
    const bubbleAppName = Deno.env.get("BUBBLE_APP_NAME");

    if (!bubbleApiKey || !bubbleAppName) {
      return new Response(
        JSON.stringify({ error: "Missing BUBBLE_API_KEY or BUBBLE_APP_NAME env vars" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { entityName, verifyFields } = await req.json();

    if (!entityName || !BUBBLE_TYPE_MAP[entityName]) {
      return new Response(
        JSON.stringify({ error: `Unknown entity: ${entityName}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const bubbleType = BUBBLE_TYPE_MAP[entityName];
    const baseUrl = `https://${bubbleAppName}.bubbleapps.io/api/1.1/obj/${encodeURIComponent(bubbleType)}`;

    // ============ MODE: Verify specific fields ============
    if (verifyFields && Array.isArray(verifyFields) && verifyFields.length > 0) {
      // For each field, query Bubble with multiple constraint strategies
      const verifiedFields: Record<string, { exists: boolean; count: number; method: string }> = {};

      // First, fetch a sample of records to check if field keys exist in response
      const sampleUrl = `${baseUrl}?limit=100`;
      const sampleResp = await fetch(sampleUrl, {
        headers: { Authorization: `Bearer ${bubbleApiKey}` },
      });
      let sampleRecords: Record<string, unknown>[] = [];
      if (sampleResp.ok) {
        const sampleData = await sampleResp.json();
        sampleRecords = sampleData.response?.results || [];
      }

      // Build a set of all keys found in sample records (case-insensitive)
      const sampleKeysLower = new Set<string>();
      const sampleKeyOriginal = new Map<string, string>();
      for (const record of sampleRecords) {
        for (const key of Object.keys(record)) {
          sampleKeysLower.add(key.toLowerCase());
          sampleKeyOriginal.set(key.toLowerCase(), key);
        }
      }

      for (const fieldName of verifyFields) {
        try {
          // Check if the field exists in sample records (case-insensitive + normalize hyphens/spaces)
          const fieldLower = fieldName.toLowerCase();
          const fieldNormalized = fieldName.toLowerCase().replace(/[-\s]+/g, "_");
          
          // Find matching key in sample
          let foundInSample = sampleKeysLower.has(fieldLower);
          let sampleCount = 0;
          
          if (!foundInSample) {
            // Try normalized matching
            for (const [sampleKeyLow, originalKey] of sampleKeyOriginal.entries()) {
              const sampleNormalized = sampleKeyLow.replace(/[-\s]+/g, "_");
              if (sampleNormalized === fieldNormalized) {
                foundInSample = true;
                break;
              }
            }
          }

          // Count values in sample for this field
          if (foundInSample) {
            for (const record of sampleRecords) {
              // Try to find the value using various key forms
              let val = record[fieldName];
              if (val === undefined) {
                // Try case-insensitive
                for (const [key, keyVal] of Object.entries(record)) {
                  if (key.toLowerCase() === fieldLower || 
                      key.toLowerCase().replace(/[-\s]+/g, "_") === fieldNormalized) {
                    val = keyVal;
                    break;
                  }
                }
              }
              if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
                sampleCount++;
              }
            }
          }

          // Strategy 1: is_not_empty constraint
          const constraints = JSON.stringify([
            { key: fieldName, constraint_type: "is_not_empty" }
          ]);
          const verifyUrl = `${baseUrl}?constraints=${encodeURIComponent(constraints)}&limit=1`;
          const vResp = await fetch(verifyUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });

          if (vResp.ok) {
            const vData = await vResp.json();
            const remaining = vData.response?.remaining || 0;
            const resultsCount = vData.response?.results?.length || 0;
            const totalWithValue = remaining + resultsCount;

            if (totalWithValue > 0) {
              verifiedFields[fieldName] = { exists: true, count: totalWithValue, method: "is_not_empty" };
              continue;
            }

            // Strategy 2: not equal ""
            const altConstraints = JSON.stringify([
              { key: fieldName, constraint_type: "not equal", value: "" }
            ]);
            const altUrl = `${baseUrl}?constraints=${encodeURIComponent(altConstraints)}&limit=1`;
            const altResp = await fetch(altUrl, {
              headers: { Authorization: `Bearer ${bubbleApiKey}` },
            });

            if (altResp.ok) {
              const altData = await altResp.json();
              const altRemaining = altData.response?.remaining || 0;
              const altResultsCount = altData.response?.results?.length || 0;
              const altCount = altRemaining + altResultsCount;

              if (altCount > 0) {
                verifiedFields[fieldName] = { exists: true, count: altCount, method: "not_equal_empty" };
                continue;
              }
            }

            // Strategy 3: not equal [] (for list fields)
            const listConstraints = JSON.stringify([
              { key: fieldName, constraint_type: "not equal", value: [] }
            ]);
            const listUrl = `${baseUrl}?constraints=${encodeURIComponent(listConstraints)}&limit=1`;
            const listResp = await fetch(listUrl, {
              headers: { Authorization: `Bearer ${bubbleApiKey}` },
            });

            if (listResp.ok) {
              const listData = await listResp.json();
              const listRemaining = listData.response?.remaining || 0;
              const listResultsCount = listData.response?.results?.length || 0;
              const listCount = listRemaining + listResultsCount;

              if (listCount > 0) {
                verifiedFields[fieldName] = { exists: true, count: listCount, method: "not_equal_empty_list" };
                continue;
              }
            }

            // All constraint strategies returned 0, but check sample
            if (foundInSample && sampleCount > 0) {
              verifiedFields[fieldName] = { exists: true, count: sampleCount, method: "sample_found" };
            } else if (foundInSample) {
              verifiedFields[fieldName] = { exists: true, count: 0, method: "key_exists_no_values" };
            } else {
              verifiedFields[fieldName] = { exists: true, count: 0, method: "all_zero" };
            }
          } else {
            // Constraint API failed — but field might still exist in sample data
            if (foundInSample && sampleCount > 0) {
              verifiedFields[fieldName] = { exists: true, count: sampleCount, method: "sample_fallback" };
            } else if (foundInSample) {
              verifiedFields[fieldName] = { exists: true, count: 0, method: "key_exists_constraint_failed" };
            } else {
              verifiedFields[fieldName] = { exists: false, count: 0, method: "api_error" };
            }
          }
        } catch {
          verifiedFields[fieldName] = { exists: false, count: 0, method: "exception" };
        }
      }

      return new Response(
        JSON.stringify({ data: { verifiedFields } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ============ MODE: Normal field stats (exact count via is_not_empty) ============
    // Step 1: Fetch a sample to discover all field names + get totalRows
    const url = `${baseUrl}?limit=100`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bubbleApiKey}`,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(
        JSON.stringify({ error: `Bubble API error (${resp.status}): ${text}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    const data = await resp.json();
    const results = data.response?.results || [];
    const totalRows = (data.response?.remaining || 0) + results.length;
    const sampleSize = results.length;

    if (sampleSize === 0) {
      return new Response(
        JSON.stringify({ data: { fields: {}, totalRows: 0, sampleSize: 0, allKeys: [] } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Collect ALL field names from ALL records in sample
    const allFields = new Set<string>();
    for (const record of results) {
      for (const key of Object.keys(record)) {
        if (key.startsWith("_")) continue;
        allFields.add(key);
      }
    }

    const allKeysArray = Array.from(allFields).sort();

    // Count non-empty values in sample for each field
    const sampleFilledCounts: Record<string, number> = {};
    for (const fieldName of allFields) {
      let count = 0;
      for (const record of results) {
        const val = record[fieldName];
        if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
          count++;
        }
      }
      sampleFilledCounts[fieldName] = count;
    }

    // Helper: fetch ALL records from Bubble using pagination, return only specified fields' values
    async function fetchAllRecordsForFields(fieldsToCount: string[]): Promise<Record<string, unknown>[]> {
      const allRecords: Record<string, unknown>[] = [];
      let cursor = 0;
      const PAGE_SIZE = 100;
      let hasMore = true;

      while (hasMore) {
        const pageUrl = `${baseUrl}?limit=${PAGE_SIZE}&cursor=${cursor}`;
        const pageResp = await fetch(pageUrl, {
          headers: { Authorization: `Bearer ${bubbleApiKey}` },
        });

        if (!pageResp.ok) break;

        const pageData = await pageResp.json();
        const pageResults = pageData.response?.results || [];
        const remaining = pageData.response?.remaining || 0;

        allRecords.push(...pageResults);
        cursor += pageResults.length;
        hasMore = remaining > 0 && pageResults.length > 0;
      }

      return allRecords;
    }

    // Step 2: For each field, query Bubble with is_not_empty to get exact count
    // If is_not_empty returns 0 but sample has values, retry with "not equal" constraint
    // Process in batches of 5 to avoid rate limiting
    const BATCH_SIZE = 5;
    const fields: Record<string, { filledCount: number; totalRows: number; isExact: boolean; method: string }> = {};

    // Track fields that need full scan
    const fieldsNeedingFullScan: string[] = [];

    const fieldList = Array.from(allFields);
    for (let i = 0; i < fieldList.length; i += BATCH_SIZE) {
      const batch = fieldList.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (fieldName) => {
        try {
          // Try is_not_empty first
          const constraints = JSON.stringify([
            { key: fieldName, constraint_type: "is_not_empty" }
          ]);
          const fieldUrl = `${baseUrl}?constraints=${encodeURIComponent(constraints)}&limit=1`;
          const fResp = await fetch(fieldUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });

          if (fResp.ok) {
            const fData = await fResp.json();
            const remaining = fData.response?.remaining || 0;
            const resultsCount = fData.response?.results?.length || 0;
            const count = remaining + resultsCount;

            // If is_not_empty returns 0 but sample data shows values, try alternative constraints
            if (count === 0 && sampleFilledCounts[fieldName] > 0) {
              // Try "not equal" empty string
              const altConstraints = JSON.stringify([
                { key: fieldName, constraint_type: "not equal", value: "" }
              ]);
              const altUrl = `${baseUrl}?constraints=${encodeURIComponent(altConstraints)}&limit=1`;
              const altResp = await fetch(altUrl, {
                headers: { Authorization: `Bearer ${bubbleApiKey}` },
              });

              if (altResp.ok) {
                const altData = await altResp.json();
                const altRemaining = altData.response?.remaining || 0;
                const altResultsCount = altData.response?.results?.length || 0;
                const altCount = altRemaining + altResultsCount;

                if (altCount > 0) {
                  return { fieldName, count: altCount, isExact: true, method: "not_equal_empty" };
                }
              }

              // Try "not empty" for list fields (contains at least one item)
              const listConstraints = JSON.stringify([
                { key: fieldName, constraint_type: "not equal", value: [] }
              ]);
              const listUrl = `${baseUrl}?constraints=${encodeURIComponent(listConstraints)}&limit=1`;
              const listResp = await fetch(listUrl, {
                headers: { Authorization: `Bearer ${bubbleApiKey}` },
              });

              if (listResp.ok) {
                const listData = await listResp.json();
                const listRemaining = listData.response?.remaining || 0;
                const listResultsCount = listData.response?.results?.length || 0;
                const listCount = listRemaining + listResultsCount;

                if (listCount > 0) {
                  return { fieldName, count: listCount, isExact: true, method: "not_equal_empty_list" };
                }
              }

              // All API constraint methods failed — mark for full scan
              return { fieldName, count: -1, isExact: false, method: "needs_full_scan" };
            }

            return { fieldName, count, isExact: true, method: "is_not_empty" };
          } else {
            // Field may not exist or constraint not supported
            if (sampleFilledCounts[fieldName] > 0) {
              return { fieldName, count: -1, isExact: false, method: "needs_full_scan" };
            }
            return { fieldName, count: 0, isExact: false, method: "error" };
          }
        } catch {
          if (sampleFilledCounts[fieldName] > 0) {
            return { fieldName, count: -1, isExact: false, method: "needs_full_scan" };
          }
          return { fieldName, count: 0, isExact: false, method: "exception" };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        if (result.count === -1) {
          fieldsNeedingFullScan.push(result.fieldName);
        } else {
          fields[result.fieldName] = {
            filledCount: result.count,
            totalRows,
            isExact: result.isExact,
            method: result.method,
          };
        }
      }
    }

    // Step 3: For fields that need full scan, fetch ALL records and count manually
    if (fieldsNeedingFullScan.length > 0) {
      const allRecords = await fetchAllRecordsForFields(fieldsNeedingFullScan);
      const actualTotalRows = allRecords.length || totalRows;

      for (const fieldName of fieldsNeedingFullScan) {
        let filledCount = 0;
        for (const record of allRecords) {
          const val = record[fieldName];
          if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
            filledCount++;
          }
        }
        fields[fieldName] = {
          filledCount,
          totalRows: actualTotalRows,
          isExact: true,
          method: "full_scan",
        };
      }
    }

    // Also include a sample record for debugging
    const sampleRecord: Record<string, unknown> = {};
    if (results.length > 0) {
      for (const [k, v] of Object.entries(results[0])) {
        if (!k.startsWith("_")) {
          sampleRecord[k] = v;
        }
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          fields,
          totalRows,
          sampleSize,
          allKeys: allKeysArray,
          sampleRecord,
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
