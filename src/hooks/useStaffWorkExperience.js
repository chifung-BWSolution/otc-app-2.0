import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useStaffWorkExperience(staffBubbleId) {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }
    base44.entities.StaffWorkExperience.filter(
      { staff_bubble_id: staffBubbleId, is_active: true },
      '-job_end_date',
      50
    )
      .then(data => setExperience(data || []))
      .catch(() => setExperience([]))
      .finally(() => setLoading(false));
  }, [staffBubbleId]);

  return { experience, loading };
}