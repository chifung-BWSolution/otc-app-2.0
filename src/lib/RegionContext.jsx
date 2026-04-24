import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const RegionContext = createContext({
  regions: [],
  currentRegion: null,
  userBaseLocation: "",
  loading: true,
  refresh: () => {},
});

export function RegionProvider({ children }) {
  const [regions, setRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [userBaseLocation, setUserBaseLocation] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [regionList, me] = await Promise.all([
        base44.entities.Region.filter({ is_active: true }, "sort_order", 50),
        base44.auth.me().catch(() => null),
      ]);
      setRegions(regionList);

      let baseLocation = "";
      if (me?.email) {
        const staffList = await base44.entities.Staff.filter({ work_email: me.email }, "-created_date", 1);
        baseLocation = staffList[0]?.o_base_location || "";
      }
      setUserBaseLocation(baseLocation);

      // Match region by base_locations array, fallback to code/name match
      const matched = regionList.find(r =>
        (r.base_locations || []).some(loc => baseLocation?.toLowerCase().includes(loc.toLowerCase()))
      ) || regionList.find(r =>
        baseLocation?.toLowerCase().includes(r.code?.toLowerCase() || "") ||
        baseLocation?.toLowerCase().includes(r.name?.toLowerCase() || "")
      ) || regionList[0] || null;

      setCurrentRegion(matched);
    } catch (e) {
      console.error("Region load error", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Helper: resolve a Region object from any staff base_location string
  const getRegionByLocation = (baseLocation) => {
    if (!baseLocation) return null;
    const loc = baseLocation.toLowerCase();
    return regions.find(r =>
      (r.base_locations || []).some(v => v && loc.includes(v.toLowerCase()))
    ) || regions.find(r =>
      (r.code && loc.includes(r.code.toLowerCase())) ||
      (r.name && loc.includes(r.name.toLowerCase()))
    ) || null;
  };

  return (
    <RegionContext.Provider value={{ regions, currentRegion, userBaseLocation, loading, refresh: load, setCurrentRegion, getRegionByLocation }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  return useContext(RegionContext);
}

// Helper: check if an entity item with region_codes applies to currentRegion
export function itemMatchesRegion(item, regionCode) {
  const codes = item?.region_codes || [];
  if (!codes.length) return true; // empty = all regions
  if (!regionCode) return true;
  return codes.includes(regionCode);
}