import { useMemo } from "react";
import { useRegion } from "@/lib/RegionContext";

/**
 * Filter items by current region via item.region_codes.
 * Empty region_codes means "all regions".
 */
export function useRegionalItems(items) {
  const { currentRegion } = useRegion();
  return useMemo(() => {
    if (!currentRegion) return items || [];
    return (items || []).filter(it => {
      const codes = it.region_codes || [];
      if (!codes.length) return true;
      return codes.includes(currentRegion.code);
    });
  }, [items, currentRegion]);
}