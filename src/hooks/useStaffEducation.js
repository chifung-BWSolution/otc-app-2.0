import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Load education records for a given staff bubble_id.
 */
export function useStaffEducation(staffBubbleId) {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }
    base44.entities.StaffEducation.filter(
      { staff_bubble_id: staffBubbleId, is_active: true },
      '-graduation_end_date',
      50
    )
      .then(data => { setEducation(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [staffBubbleId]);

  return { education, loading };
}