import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Leave Balance Calculation Edge Function
 * 
 * Rules:
 * 1. Current active year = count_year where expiry (next year March 31) has NOT passed
 *    - count_year format: "YYYY-12-31" → expires on (YYYY+1)-03-31
 *    - or "Jan 1, YYYY 12:00 am" format from Bubble
 * 2. Quota = SUM of bubble_leave_quota records for the active count_year
 * 3. Used = SUM of bubble_leave records where:
 *    - count_year matches active year
 *    - leave_type is 有薪假期 OR 家庭友善假 (both deduct from AL pool)
 *    - status ≠ '不批核' (rejected leaves don't count)
 * 4. Pending = leaves where approved != 'yes' and status != '不批核'
 * 5. Balance = Quota - Approved Used - Pending Used
 *    Display: show balance excluding pending, then note "−Y日待批核"
 */

// Leave types that deduct from AL quota (use startsWith matching because
// Bubble stores them with English codes like "有薪假期 AL", "家庭友善假 FL")
const AL_LEAVE_PREFIXES = ["有薪假期", "家庭友善假"];

// Normalize count_year to a comparable year number
// Important: Bubble stores dates in UTC. "2024-12-31T16:00:00.000Z" in HK timezone (UTC+8)
// is actually 2025-01-01T00:00:00, meaning count_year = 2025.
// We parse as Date and use HK timezone (UTC+8) to determine the actual year.
function getCountYearValue(countYearStr: string): number | null {
  if (!countYearStr) return null;
  
  // Try to parse as a full ISO datetime (e.g. "2024-12-31T16:00:00.000Z")
  if (countYearStr.includes("T") || countYearStr.includes("Z")) {
    const d = new Date(countYearStr);
    if (!isNaN(d.getTime())) {
      // Convert to HK timezone (UTC+8) to get the correct year
      const hkOffset = 8 * 60 * 60 * 1000;
      const hkDate = new Date(d.getTime() + hkOffset);
      return hkDate.getUTCFullYear();
    }
  }
  
  // "2025-12-31" format (date only, no time component - assume as-is)
  const isoMatch = countYearStr.match(/^(\d{4})-12-31$/);
  if (isoMatch) return parseInt(isoMatch[1]);
  
  // "Jan 1, 2025 12:00 am" format - parse as Date with HK timezone consideration
  const d2 = new Date(countYearStr);
  if (!isNaN(d2.getTime())) {
    const hkOffset = 8 * 60 * 60 * 1000;
    const hkDate = new Date(d2.getTime() + hkOffset);
    return hkDate.getUTCFullYear();
  }
  
  // Fallback: just extract any 4-digit year
  const dateMatch = countYearStr.match(/(\d{4})/);
  if (dateMatch) return parseInt(dateMatch[1]);
  
  return null;
}

// Get the current active count_year(s) - ones that haven't expired yet
function getActiveCountYears(now: Date): number[] {
  const currentYear = now.getFullYear();
  const active: number[] = [];
  
  // Check last 3 years to current
  for (let y = currentYear - 2; y <= currentYear; y++) {
    // count_year Y expires on (Y+1)-03-31
    const expiry = new Date(y + 1, 2, 31, 23, 59, 59);
    if (now <= expiry) {
      active.push(y);
    }
  }
  
  return active;
}

// Get all historical count_years from quota records
function getAllYearsFromRecords(quotaRecords: any[], leaveRecords: any[]): number[] {
  const years = new Set<number>();
  for (const q of quotaRecords) {
    const y = getCountYearValue(q.count_year);
    if (y) years.add(y);
  }
  for (const l of leaveRecords) {
    const y = getCountYearValue(l.count_year);
    if (y) years.add(y);
  }
  return [...years].sort((a, b) => b - a); // newest first
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ 
          error: "Missing env vars", 
          hasUrl: !!supabaseUrl, 
          hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
          hasServiceKeyAlt: !!Deno.env.get("SUPABASE_SERVICE_KEY"),
          availableEnvKeys: [...Deno.env.toObject()].map(([k]) => k).filter(k => k.startsWith("SUPABASE")),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let staff_names: string[] | undefined;
    try {
      const body = await req.json();
      staff_names = body?.staff_names;
    } catch (_) {
      // Empty body or invalid JSON is fine - we'll load all staff
      staff_names = undefined;
    }

    const now = new Date();
    const activeYears = getActiveCountYears(now);

    // Get staff (filter by names if provided, otherwise only active staff)
    let staffQuery = supabase
      .from("staff")
      .select("display_name, bubble_id, al_quota");
    
    if (staff_names && staff_names.length > 0) {
      staffQuery = staffQuery.in("display_name", staff_names);
    } else {
      staffQuery = staffQuery.eq("o_status", "Active");
    }
    
    const { data: staffRows } = await staffQuery.limit(500);
    
    if (!staffRows || staffRows.length === 0) {
      return new Response(JSON.stringify({ results: [], active_years: activeYears, calculated_at: now.toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const staffNameList = staffRows.map((s: any) => s.display_name);

    // Get all quota records for these staff
    const { data: allQuota, error: quotaError } = await supabase
      .from("bubble_leave_quota")
      .select("*")
      .in("staff_name", staffNameList);

    // Get all leave records for these staff (no leave_type filter for debugging)
    const { data: allLeavesRaw, error: leavesError } = await supabase
      .from("bubble_leave")
      .select("*")
      .in("staff_name", staffNameList);

    // Filter to AL types in code (use startsWith for matching "有薪假期 AL" etc.)
    const allLeaves = (allLeavesRaw || []).filter((l: any) => {
      if (!l.leave_type) return false;
      return AL_LEAVE_PREFIXES.some(prefix => l.leave_type.startsWith(prefix));
    });
    
    // Collect unique leave_types for debug
    const uniqueLeaveTypes = [...new Set((allLeavesRaw || []).map((l: any) => l.leave_type))];

    // Calculate balance per staff
    const results: any[] = [];

    for (const staff of staffRows) {
      const name = staff.display_name;
      
      const staffQuota = (allQuota || []).filter((q: any) => q.staff_name === name);
      const staffLeaves = (allLeaves || []).filter((l: any) => l.staff_name === name);
      
      // Use all years found in records (not just active years) so past records are shown
      const allStaffYears = getAllYearsFromRecords(staffQuota, staffLeaves);
      // Merge with active years to ensure current year is always shown
      const yearsToProcess = [...new Set([...allStaffYears, ...activeYears])].sort((a, b) => b - a);
      
      const yearBalances: any[] = [];
      
      for (const year of yearsToProcess) {
        // Sum quota for this year
        const yearQuotaRecords = staffQuota.filter((q: any) => {
          const qYear = getCountYearValue(q.count_year);
          return qYear === year;
        });
        
        const totalQuota = yearQuotaRecords.reduce((sum: number, q: any) => {
          const val = parseFloat(q.plus_minus_quota) || 0;
          return sum + val;
        }, 0);
        
        if (totalQuota === 0 && yearQuotaRecords.length === 0) continue;

        // Filter leaves for this year, exclude rejected
        const yearLeaves = staffLeaves.filter((l: any) => {
          const lYear = getCountYearValue(l.count_year);
          if (lYear !== year) return false;
          if (l.status === "不批核") return false;
          return true;
        });

        let approvedUsed = 0;
        let pendingUsed = 0;
        const approvedLeaveDetails: any[] = [];
        const pendingLeaveDetails: any[] = [];

        for (const leave of yearLeaves) {
          const days = parseFloat(leave.quota) || 0;
          const isApproved = leave.approved === "yes" || leave.approved === "true" || leave.approved === true;
          
          if (isApproved) {
            approvedUsed += days;
            approvedLeaveDetails.push({
              leave_type: leave.leave_type,
              days,
              start: leave.start_date_time,
              end: leave.end_date_time,
            });
          } else {
            pendingUsed += days;
            pendingLeaveDetails.push({
              leave_type: leave.leave_type,
              days,
              start: leave.start_date_time,
              end: leave.end_date_time,
            });
          }
        }

        const balance = totalQuota - approvedUsed - pendingUsed;

        // Build quota detail records for timeline display
        const quotaDetails = yearQuotaRecords.map((q: any) => ({
          calculation_date: q.calculation_date,
          plus_minus_quota: q.plus_minus_quota,
          reason: q.reason || q.operator_text || "",
        })).sort((a: any, b: any) => {
          // Sort by calculation_date descending (newest first)
          return (b.calculation_date || "").localeCompare(a.calculation_date || "");
        });

        // Check if this year's quota is expired
        const expiryDate = new Date(year + 1, 2, 31, 23, 59, 59);
        const isExpired = now > expiryDate;

        yearBalances.push({
          count_year: year,
          count_year_label: `${year}-12-31`,
          expiry_date: `${year + 1}-03-31`,
          is_expired: isExpired,
          total_quota: Math.round(totalQuota * 100) / 100,
          approved_used: Math.round(approvedUsed * 100) / 100,
          pending_used: Math.round(pendingUsed * 100) / 100,
          total_used: Math.round((approvedUsed + pendingUsed) * 100) / 100,
          balance: Math.round(balance * 100) / 100,
          balance_excluding_pending: Math.round((totalQuota - approvedUsed) * 100) / 100,
          quota_records_count: yearQuotaRecords.length,
          leave_records_count: yearLeaves.length,
          approved_leaves: approvedLeaveDetails,
          pending_leaves: pendingLeaveDetails,
          quota_details: quotaDetails,
        });
      }

      const totalBalance = yearBalances.reduce((s: number, yb: any) => s + yb.balance, 0);
      const totalPending = yearBalances.reduce((s: number, yb: any) => s + yb.pending_used, 0);
      const totalQuotaAll = yearBalances.reduce((s: number, yb: any) => s + yb.total_quota, 0);
      const totalApproved = yearBalances.reduce((s: number, yb: any) => s + yb.approved_used, 0);

      results.push({
        staff_name: name,
        total_quota: Math.round(totalQuotaAll * 100) / 100,
        total_approved_used: Math.round(totalApproved * 100) / 100,
        total_pending_used: Math.round(totalPending * 100) / 100,
        balance: Math.round(totalBalance * 100) / 100,
        balance_excluding_pending: Math.round((totalQuotaAll - totalApproved) * 100) / 100,
        year_details: yearBalances,
      });
    }

    return new Response(JSON.stringify({ 
      results, 
      active_years: activeYears, 
      calculated_at: now.toISOString(),
      _debug: {
        staff_count: staffRows.length,
        staff_names_queried: staffNameList,
        quota_records_found: allQuota?.length ?? 0,
        quota_error: quotaError?.message || null,
        leave_records_found: allLeaves?.length ?? 0,
        leave_records_raw_total: allLeavesRaw?.length ?? 0,
        leaves_error: leavesError?.message || null,
        unique_leave_types_in_db: uniqueLeaveTypes,
        sample_quota: (allQuota || []).slice(0, 10).map((q: any) => ({
          ...q,
          _parsed_year: getCountYearValue(q.count_year),
        })),
        sample_leaves_raw: (allLeavesRaw || []).slice(0, 20).map((l: any) => ({
          staff_name: l.staff_name,
          leave_type: l.leave_type,
          count_year: l.count_year,
          _parsed_year: getCountYearValue(l.count_year),
          quota: l.quota,
          approved: l.approved,
          status: l.status,
          start_date_time: l.start_date_time,
          end_date_time: l.end_date_time,
          bubble_id: l.bubble_id,
        })),
        sample_leaves_al: allLeaves.slice(0, 10).map((l: any) => ({
          staff_name: l.staff_name,
          leave_type: l.leave_type,
          count_year: l.count_year,
          _parsed_year: getCountYearValue(l.count_year),
          quota: l.quota,
          approved: l.approved,
          status: l.status,
          start_date_time: l.start_date_time,
        })),
        active_years_used: activeYears,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
