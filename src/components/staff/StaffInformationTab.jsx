import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook to load StaffInformation by staff bubble_id.
 * Returns { staffInfo, loading }
 */
export function useStaffInformation(staffBubbleId) {
  const [staffInfo, setStaffInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }
    base44.entities.StaffInformation.filter({ staff_id: staffBubbleId }, '-created_date', 1)
      .then(data => { setStaffInfo(data[0] || null); setLoading(false); });
  }, [staffBubbleId]);

  return { staffInfo, loading };
}

// Re-export default for backward compat (not used anymore but safe)
export default function StaffInformationTab() { return null; }