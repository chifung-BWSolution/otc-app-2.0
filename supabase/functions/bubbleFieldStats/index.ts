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
  BubbleLeaveQuota: "leavequota",
  BubbleClockin: "Clock-in",
  BubbleManHourDate: "Man Hour Date",
  BubbleManHourTask: "Man Hour Task",
  BubbleProject: "Project",
  BubbleStaffKPI: "Staff KPI",
  BubbleStaffKPIMonth: "Staff KPI Month",
};

// Display Name → list of API key variants to try for constraint queries
// Bubble API constraints only work with the API key format (snake_case with type suffix)
const DISPLAY_TO_API_KEYS: Record<string, Record<string, string[]>> = {
  BubbleClockin: {
    "Tags - in": ["tag___in_list_text", "tags___in_list_text", "tags_in_list_text", "tag_list_text", "tags_list_text", "tags___in_list_text_2"],
    "Tags - In": ["tag___in_list_text", "tags___in_list_text", "tags_in_list_text", "tag_list_text", "tags_list_text", "tags___in_list_text_2"],
    "Tag - In": ["tag___in_list_text", "tags___in_list_text", "tags_in_list_text", "tag_list_text", "tags_list_text"],
    "Tags - out": ["tag___out_list_text", "tags___out_list_text", "tags_out_list_text"],
    "Tags - Out": ["tag___out_list_text", "tags___out_list_text", "tags_out_list_text"],
    "Tag - Out": ["tag___out_list_text", "tags___out_list_text", "tags_out_list_text"],
    "Remarks": ["remarks_text", "remarks___in_text"],
    "Remarks - In": ["remarks_text", "remarks___in_text"],
    "Remarks - Out": ["remarks___out_text"],
    "N_Work Location": ["n_work_location_custom_nos_work_location"],
    "N_Work Location - In": ["n_work_location_custom_nos_work_location"],
    "N_Work Location - Out": ["n_work_location___out_custom_nos_work_location"],
    "O_Status - In": ["o_status___in_option_o_clockin_status"],
    "O_Status - Out": ["o_status___out_option_o_clockin_status"],
    "O_Photo Approval - In": ["o_photo_approval___in_option_o_photo_approval"],
    "O_Photo Approval - Out": ["o_photo_approval___out_option_o_photo_approval"],
    "Geo Location - In": ["geo_location___in_geographic_address"],
    "Geo Location - Out": ["geo_location___out_geographic_address"],
    "Google Location - In": ["google_location___in_text"],
    "Google Location - Out": ["google_location___out_text"],
    "Accuracy - In": ["accuracy___in_number"],
    "Accuracy - Out": ["accuracy___out_number"],
    "Face Image - Out": ["face_image___out_image"],
    "Face Image File URL - In": ["face_image_file_url___in_text"],
    "Face Image File URL - Out": ["face_image_file_url___out_text"],
  },
  BubbleLeave: {
    "Start Date & Time": ["start_date___time_date"],
    "End Date & Time": ["end_date___time_date"],
    "Leave Type": ["leave_type_custom_leave_type"],
    "Leave Period": ["leave_period_custom_leave_period"],
  },
  BubbleOT: {
    "Start Date & Time": ["start_date___time_date"],
    "End Date & Time": ["end_date___time_date"],
    "OT Type": ["ot_type_custom_ot_type"],
  },
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
      const verifiedFields: Record<string, { exists: boolean; count: number; method: string; debug?: unknown }> = {};

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
      
      // Collect all unique keys from sample for debug
      const allSampleKeys = Array.from(sampleKeyOriginal.values()).sort();

      for (const fieldName of verifyFields) {
        try {
          // Per Bubble Swagger: the display name IS the API key for both constraints and response
          // Bubble omits fields entirely from response when they're null/empty
          // So a field not appearing in samples doesn't mean it doesn't exist
          
          const entityApiKeys = DISPLAY_TO_API_KEYS[entityName] || {};
          const apiKeyVariants = entityApiKeys[fieldName] || [];
          
          // Keys to try: display name FIRST (correct per Swagger), then legacy snake_case variants
          const keysToTry: string[] = [fieldName, ...apiKeyVariants];
          
          // Strategy A: Direct constraint queries (most reliable per Swagger docs)
          let verified = false;

          // Get total record count upfront for false positive detection
          let totalRecordsCache: number | null = null;
          async function getTotalRecords(): Promise<number> {
            if (totalRecordsCache !== null) return totalRecordsCache;
            const totalUrl = `${baseUrl}?limit=1`;
            const totalResp = await fetch(totalUrl, {
              headers: { Authorization: `Bearer ${bubbleApiKey}` },
            });
            if (totalResp.ok) {
              const totalData = await totalResp.json();
              totalRecordsCache = (totalData.response?.remaining || 0) + (totalData.response?.results?.length || 0);
            } else {
              totalRecordsCache = 0;
            }
            return totalRecordsCache!;
          }

          // Detect if this is likely a list field from Swagger/config
          const isListField = apiKeyVariants.some(v => v.includes("list_") || v.includes("_list"));

          for (const tryKey of keysToTry) {
            if (verified) break;

            // Strategy 1: is_not_empty constraint
            const constraints = JSON.stringify([
              { key: tryKey, constraint_type: "is_not_empty" }
            ]);
            const verifyUrl = `${baseUrl}?constraints=${encodeURIComponent(constraints)}&limit=5`;
            const vResp = await fetch(verifyUrl, {
              headers: { Authorization: `Bearer ${bubbleApiKey}` },
            });

            if (vResp.ok) {
              const vData = await vResp.json();
              const remaining = vData.response?.remaining || 0;
              const results = vData.response?.results || [];
              const totalWithValue = remaining + results.length;

              if (totalWithValue > 0) {
                const totalRecs = await getTotalRecords();
                
                // KEY INSIGHT: If count < total, the constraint IS working (filtering out empty records)
                // We don't need to verify field presence in response — Bubble may use different key names
                if (totalWithValue < totalRecs) {
                  verifiedFields[fieldName] = { exists: true, count: totalWithValue, method: `is_not_empty(${tryKey})` };
                  verified = true;
                  break;
                }
                
                // If count == total, verify if constraint is truly filtering or being ignored
                // Check if returned records contain the field value (try ALL known variants)
                if (results.length > 0) {
                  const allVariants = [fieldName, tryKey, ...apiKeyVariants];
                  const hasRealValue = results.some((r: Record<string, unknown>) => {
                    for (const vKey of allVariants) {
                      const val = r[vKey];
                      if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
                        return true;
                      }
                    }
                    // Also try case-insensitive match
                    const fieldLower = fieldName.toLowerCase().replace(/[\s\-]/g, "");
                    for (const [rKey, rVal] of Object.entries(r)) {
                      const keyNorm = rKey.toLowerCase().replace(/[\s\-_]/g, "");
                      if ((keyNorm === fieldLower || keyNorm.includes(fieldLower)) && rVal !== null && rVal !== undefined && rVal !== "" && !(Array.isArray(rVal) && rVal.length === 0)) {
                        return true;
                      }
                    }
                    return false;
                  });
                  if (hasRealValue) {
                    verifiedFields[fieldName] = { exists: true, count: totalWithValue, method: `is_not_empty_all(${tryKey})` };
                    verified = true;
                    break;
                  }
                }
              }

              // Strategy 2: not equal "" (for text fields)
              if (!verified) {
                const altConstraints = JSON.stringify([
                  { key: tryKey, constraint_type: "not equal", value: "" }
                ]);
                const altUrl = `${baseUrl}?constraints=${encodeURIComponent(altConstraints)}&limit=5`;
                const altResp = await fetch(altUrl, {
                  headers: { Authorization: `Bearer ${bubbleApiKey}` },
                });

                if (altResp.ok) {
                  const altData = await altResp.json();
                  const altRemaining = altData.response?.remaining || 0;
                  const altResults = altData.response?.results || [];
                  const altCount = altRemaining + altResults.length;

                  const totalRecs2 = await getTotalRecords();
                  if (altCount > 0 && altCount < totalRecs2) {
                    verifiedFields[fieldName] = { exists: true, count: altCount, method: `not_equal_empty(${tryKey})` };
                    verified = true;
                    break;
                  } else if (altCount > 0 && altResults.length > 0) {
                    // Verify with actual values using all known variants
                    const allVariants2 = [fieldName, tryKey, ...apiKeyVariants];
                    const hasVal = altResults.some((r: Record<string, unknown>) => {
                      for (const vKey of allVariants2) {
                        const val = r[vKey];
                        if (val !== null && val !== undefined && val !== "") return true;
                      }
                      return false;
                    });
                    if (hasVal) {
                      verifiedFields[fieldName] = { exists: true, count: altCount, method: `not_equal_empty_verified(${tryKey})` };
                      verified = true;
                      break;
                    }
                  }
                }
              }

              // Strategy 3: not equal [] (for list fields)
              if (!verified && isListField) {
                const listConstraints = JSON.stringify([
                  { key: tryKey, constraint_type: "not equal", value: [] }
                ]);
                const listUrl = `${baseUrl}?constraints=${encodeURIComponent(listConstraints)}&limit=5`;
                const listResp = await fetch(listUrl, {
                  headers: { Authorization: `Bearer ${bubbleApiKey}` },
                });

                if (listResp.ok) {
                  const listData = await listResp.json();
                  const listRemaining = listData.response?.remaining || 0;
                  const listResults = listData.response?.results || [];
                  const listCount = listRemaining + listResults.length;

                  const totalRecs3 = await getTotalRecords();
                  if (listCount > 0 && listCount < totalRecs3) {
                    verifiedFields[fieldName] = { exists: true, count: listCount, method: `not_equal_empty_list(${tryKey})` };
                    verified = true;
                    break;
                  } else if (listCount > 0 && listResults.length > 0) {
                    const allVariants3 = [fieldName, tryKey, ...apiKeyVariants];
                    const hasVal = listResults.some((r: Record<string, unknown>) => {
                      for (const vKey of allVariants3) {
                        const val = r[vKey];
                        if (val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0)) return true;
                      }
                      return false;
                    });
                    if (hasVal) {
                      verifiedFields[fieldName] = { exists: true, count: listCount, method: `not_equal_empty_list_verified(${tryKey})` };
                      verified = true;
                      break;
                    }
                  }
                }
              }
            }
          }

          // Strategy B: Sample-based counting from multiple offsets
          // Since Bubble omits empty fields, we need to look at many records to find ones with values
          if (!verified) {
            let sampleFilled = 0;
            let sampleTotal = 0;
            const offsets = [0, 100, 500, 1000, 2000, 5000];
            
            for (const offset of offsets) {
              const sUrl = `${baseUrl}?limit=100&cursor=${offset}`;
              const sResp = await fetch(sUrl, {
                headers: { Authorization: `Bearer ${bubbleApiKey}` },
              });
              if (sResp.ok) {
                const sData = await sResp.json();
                const results = sData.response?.results || [];
                if (results.length === 0) break;
                sampleTotal += results.length;
                
                for (const record of results) {
                  // Try display name first (per Swagger), then variants
                  let val: unknown = record[fieldName];
                  if (val === undefined) {
                    for (const variant of apiKeyVariants) {
                      val = record[variant];
                      if (val !== undefined) break;
                    }
                  }
                  if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) {
                    sampleFilled++;
                  }
                }
                
                // If we found some values, we can stop early
                if (sampleFilled > 3) break;
              }
            }
            
            if (sampleFilled > 0) {
              const totalRecs = await getTotalRecords();
              const estimatedCount = Math.round((sampleFilled / sampleTotal) * totalRecs);
              verifiedFields[fieldName] = { 
                exists: true, 
                count: estimatedCount, 
                method: `sample_counting(${fieldName}, ${sampleFilled}/${sampleTotal})` 
              };
            } else {
              // Check sample count from original 100 records
              let foundInOriginalSample = false;
              for (const record of sampleRecords) {
                if (fieldName in record) {
                  foundInOriginalSample = true;
                  break;
                }
                // Also check variants
                for (const v of apiKeyVariants) {
                  if (v in record) {
                    foundInOriginalSample = true;
                    break;
                  }
                }
                if (foundInOriginalSample) break;
              }
              
              if (foundInOriginalSample) {
                verifiedFields[fieldName] = { exists: true, count: 0, method: `key_exists_no_values(${fieldName})` };
              } else if (sampleTotal > 0) {
                // Field not found in any sample AND constraint queries failed
                // But per Swagger the field DOES exist - it's just that all checked records are empty
                verifiedFields[fieldName] = { exists: true, count: 0, method: `sparse_field_no_values_in_${sampleTotal}_samples(${fieldName})` };
              } else {
                verifiedFields[fieldName] = { exists: false, count: 0, method: "not_found" };
              }
            }
          }
        } catch {
          verifiedFields[fieldName] = { exists: false, count: 0, method: "exception" };
        }
      }

      // Filter sample keys that contain "tag" for debug
      const tagRelatedKeys = allSampleKeys.filter(k => k.toLowerCase().includes("tag"));
      
      return new Response(
        JSON.stringify({ data: { verifiedFields, _debug: { allSampleKeys, tagRelatedKeys, sampleRecordCount: sampleRecords.length } } }),
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
    // 
    // IMPORTANT: Bubble constraint keys MUST use the display name (e.g. "Tags - in"),
    // but the list endpoint response may return snake_case keys (e.g. "tag___in_list_text").
    // We need to map response keys back to display names for constraint queries.
    
    // Build reverse map: response_key (snake_case) → display_name
    const entityApiKeys = DISPLAY_TO_API_KEYS[entityName] || {};
    const responseKeyToDisplayName: Record<string, string> = {};
    for (const [displayName, variants] of Object.entries(entityApiKeys)) {
      for (const variant of variants) {
        responseKeyToDisplayName[variant] = displayName;
      }
    }

    const BATCH_SIZE = 5;
    const fields: Record<string, { filledCount: number; totalRows: number; isExact: boolean; method: string }> = {};

    // Track fields that need full scan
    const fieldsNeedingFullScan: string[] = [];

    const fieldList = Array.from(allFields);
    for (let i = 0; i < fieldList.length; i += BATCH_SIZE) {
      const batch = fieldList.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (fieldName) => {
        try {
          // Determine the constraint key: Bubble constraints use DISPLAY NAME
          // If fieldName is already a display name, use it directly.
          // If it's a snake_case key (from response), map it back to display name.
          const displayName = responseKeyToDisplayName[fieldName] || fieldName;
          const constraintKey = displayName; // Always use display name for constraints

          // Try is_not_empty first
          const constraints = JSON.stringify([
            { key: constraintKey, constraint_type: "is_not_empty" }
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

            // RELIABLE: If count < totalRows, the constraint is definitely working (filtering out empty records)
            if (count > 0 && count < totalRows) {
              return { fieldName, count, isExact: true, method: `is_not_empty(${constraintKey})` };
            }

            // FALSE POSITIVE DETECTION: If is_not_empty returns count >= 95% of totalRows
            // but sample shows 0 filled values, it's likely a false positive
            // (Bubble's is_not_empty for custom_type/image fields treats "key exists" as not empty)
            if (count > 0 && sampleFilledCounts[fieldName] === 0 && count >= totalRows * 0.95) {
              return { fieldName, count: 0, isExact: false, method: "is_not_empty_false_positive" };
            }

            // If is_not_empty returns 0 but sample data shows values, try alternative constraints
            if (count === 0 && sampleFilledCounts[fieldName] > 0) {
              // Try "not equal" empty string
              const altConstraints = JSON.stringify([
                { key: constraintKey, constraint_type: "not equal", value: "" }
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
                  return { fieldName, count: altCount, isExact: true, method: `not_equal_empty(${constraintKey})` };
                }
              }

              // Try "not empty" for list fields (contains at least one item)
              const listConstraints = JSON.stringify([
                { key: constraintKey, constraint_type: "not equal", value: [] }
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

                if (listCount > 0 && listCount < totalRows) {
                  return { fieldName, count: listCount, isExact: true, method: `not_equal_empty_list(${constraintKey})` };
                }
              }

              // All API constraint methods failed — mark for full scan
              return { fieldName, count: -1, isExact: false, method: "needs_full_scan" };
            }

            return { fieldName, count, isExact: true, method: `is_not_empty(${constraintKey})` };
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
