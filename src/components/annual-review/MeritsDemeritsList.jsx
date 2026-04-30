import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Award, AlertTriangle } from "lucide-react";

export default function MeritsDemeritsList({ staffId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffId) { setLoading(false); return; }
    base44.entities.BubbleMeritsDemerits.filter({ staff_id: staffId }, "-event_date", 200)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [staffId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">載入功過紀錄...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return <div className="text-center py-6 text-gray-400 text-sm">暫無功過紀錄</div>;
  }

  return (
    <div className="space-y-2">
      {records.map((r, i) => {
        const isMerit = (r.type || "").includes("優") || (r.type || "").includes("功") || (r.type || "").includes("merit") || (r.type || "").toLowerCase().includes("merit");
        const isDemerit = !isMerit;
        return (
          <div key={r.id || i} className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${
            isDemerit ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isDemerit ? "bg-red-100" : "bg-green-100"
            }`}>
              {isDemerit
                ? <AlertTriangle size={15} className="text-red-500" />
                : <Award size={15} className="text-green-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isDemerit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {r.type || (isDemerit ? "過" : "功")}
                </span>
                {r.event_date && (
                  <span className="text-xs text-gray-400">
                    {new Date(r.event_date).toLocaleDateString("zh-HK")}
                  </span>
                )}
              </div>
              {r.brief_description && (
                <div className="text-sm font-medium text-gray-800 mt-1">{r.brief_description}</div>
              )}
              {r.detailed_description && (
                <div className="text-sm text-gray-600 mt-0.5 leading-relaxed">{r.detailed_description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}