import { Search, CheckCircle2, Clock, FileEdit } from "lucide-react";
import { useState, useMemo } from "react";

export default function ColleagueSelector({ colleagues, existingReviews, myStaffId, onSelect }) {
  const [search, setSearch] = useState("");

  // Map reviewee_staff_id → review status
  const reviewMap = useMemo(() => {
    const m = {};
    for (const r of existingReviews) {
      m[r.reviewee_staff_id] = r.status;
    }
    return m;
  }, [existingReviews]);

  const filtered = useMemo(() => {
    return colleagues
      .filter(c => c.bubble_id !== myStaffId) // exclude self
      .filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (c.display_name || "").toLowerCase().includes(q) ||
               (c.position || "").toLowerCase().includes(q) ||
               (c.team_name || "").toLowerCase().includes(q);
      });
  }, [colleagues, myStaffId, search]);

  const submittedCount = existingReviews.filter(r => r.status === "submitted").length;
  const eligibleCount = colleagues.filter(c => c.bubble_id !== myStaffId).length;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
          <div className="text-xl font-bold text-indigo-600">{eligibleCount}</div>
          <div className="text-xs text-gray-500">可互評同事</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-xl font-bold text-green-600">{submittedCount}</div>
          <div className="text-xs text-gray-500">已提交</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
          <div className="text-xl font-bold text-amber-600">{eligibleCount - submittedCount}</div>
          <div className="text-xs text-gray-500">未完成</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          placeholder="搜尋同事姓名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的同事</div>
        ) : (
          filtered.map(c => {
            const status = reviewMap[c.bubble_id];
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-indigo-50/40 transition-colors text-left"
              >
                {c.profile_pic ? (
                  <img src={c.profile_pic} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(c.display_name || "?")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{c.display_name}</div>
                  <div className="text-xs text-gray-400">{c.team_name} · {c.position || "—"}</div>
                </div>
                {status === "submitted" ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-semibold shrink-0">
                    <CheckCircle2 size={12} /> 已提交
                  </span>
                ) : status === "draft" ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-semibold shrink-0">
                    <FileEdit size={12} /> 草稿
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium shrink-0">
                    <Clock size={12} /> 未開始
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}