import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Returns: { absenceMap, holidays, loading }
//   absenceMap: { [email]: { leave_type, from_date, to_date, return_date, delegate_name, delegate_email, reason } }
//   holidays: [{ title, event_date, end_date }]  — today's company-wide holidays
export function useAbsenceStatus() {
  const [absenceMap, setAbsenceMap] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().split("T")[0];

      const [approved, events] = await Promise.all([
        base44.entities.BubbleLeave.filter({}, "-from_date", 500),
        base44.entities.CompanyEvent.filter({ event_type: "假期", is_active: true }, "-event_date", 200),
      ]);

      if (cancelled) return;

      // Build map: pick any leave covering today (status = approved/已批核)
      const map = {};
      approved.filter(lr => lr.status === "已批核" || lr.status === "approved").forEach(lr => {
        const email = lr.user_email;
        const fromDate = lr.from_date || lr.start_date_time;
        const toDate = lr.to_date || lr.end_date_time;
        if (!email || !fromDate || !toDate) return;
        if (fromDate <= today && toDate >= today) {
          const nextDay = new Date(toDate);
          nextDay.setDate(nextDay.getDate() + 1);
          map[email] = {
            leave_type: lr.leave_type,
            from_date: fromDate,
            to_date: toDate,
            return_date: nextDay.toISOString().split("T")[0],
            delegate_name: lr.delegate_name || "",
            delegate_email: lr.delegate_email || "",
            reason: lr.reason || lr.application_reason || "",
            time_slot: lr.time_slot,
          };
        }
      });
      setAbsenceMap(map);

      const todaysHolidays = events.filter(e => {
        const start = e.event_date;
        const end = e.end_date || e.event_date;
        return start && start <= today && end >= today;
      });
      setHolidays(todaysHolidays);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { absenceMap, holidays, loading };
}