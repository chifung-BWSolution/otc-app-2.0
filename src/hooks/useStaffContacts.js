import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Load emergency contact people for a given staff bubble_id.
 */
export function useStaffContacts(staffBubbleId) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }
    base44.entities.StaffContactPerson.filter(
      { staff_bubble_id: staffBubbleId, is_active: true },
      '-created_date',
      50
    )
      .then(data => { setContacts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [staffBubbleId]);

  return { contacts, loading };
}