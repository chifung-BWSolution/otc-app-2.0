import { useRegion } from "@/lib/RegionContext";
import { Globe2 } from "lucide-react";

export default function RegionBadge({ className = "" }) {
  const { currentRegion, loading } = useRegion();

  if (loading) return null;
  if (!currentRegion) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold ${className}`}>
        <Globe2 size={12} /> 未設定地區
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${className}`}
      style={{ backgroundColor: currentRegion.color || "#14b8a6" }}>
      <span>{currentRegion.icon || "🏢"}</span>
      {currentRegion.full_name || currentRegion.name}
    </span>
  );
}