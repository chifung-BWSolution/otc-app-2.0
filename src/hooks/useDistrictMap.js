import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Returns a map of Bubble ID → display label for NOSDistrict.
 * Label format: "區域 - 分區" (e.g. "中西區 - 上環")
 */
export function useDistrictMap() {
  const [districtMap, setDistrictMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.NOSDistrict.list('-created_date', 500)
      .then(list => {
        const map = {};
        for (const d of list) {
          if (d.bubble_id) {
            const label = [d.area, d.district, d.sub_district].filter(Boolean).join(' - ');
            map[d.bubble_id] = label || d.bubble_id;
          }
        }
        setDistrictMap(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { districtMap, loading };
}