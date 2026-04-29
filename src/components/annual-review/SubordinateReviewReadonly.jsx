import { ArrowLeft } from "lucide-react";

function parseContribution(note) {
  if (!note) return "";
  try {
    const arr = JSON.parse(note);
    if (Array.isArray(arr)) {
      return arr.map(pt => {
        if (typeof pt === "object" && pt.type) return `[${pt.type}] ${pt.text}`;
        return typeof pt === "string" ? pt : pt.text || "";
      }).filter(Boolean).join("；");
    }
  } catch {}
  return note;
}

export default function SubordinateReviewReadonly({ review, onBack }) {
  const r = review;

  const scoredProjects = (r.project_contributions || []).filter(p => p.self_score > 0);
  const scoredExtras = (r.extra_contributions || []).filter(e => e.self_score > 0);

  const statusMap = {
    peer_review_pending: { label: "待完成同事互評", color: "bg-amber-100 text-amber-700" },
    pending_leader: { label: "待Leader評分", color: "bg-blue-100 text-blue-700" },
    pending_boss: { label: "待老闆面談", color: "bg-purple-100 text-purple-700" },
  };
  const st = statusMap[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{r.staff_name} 的評估表</h2>
          <p className="text-sm text-gray-400">{r.staff_position} · {r.staff_team} · {r.fiscal_year}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
      </div>

      {/* Scored projects */}
      {scoredProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-blue-800 px-1">📊 項目工作（{scoredProjects.length} 項已自評）</h3>
          {scoredProjects.map((p, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <div className="font-semibold text-base text-gray-900">{p.project_name}</div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-blue-600 font-bold">{p.hours}h</span>
                <span>{p.tasks} 個任務</span>
                {p.sales_amount > 0 && <span className="text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>}
              </div>
              {p.contribution_note && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                  {parseContribution(p.contribution_note)}
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">員工自評：{p.self_score} 分</span>
                {p.leader_score > 0 && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Team Leader評分：{p.leader_score} 分</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scored extras */}
      {scoredExtras.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-teal-800 px-1">🌟 額外貢獻（{scoredExtras.length} 項已自評）</h3>
          {scoredExtras.map((e, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <p className="text-base text-gray-700 leading-relaxed">{e.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">員工自評：{e.self_score} 分</span>
                {e.leader_score > 0 && (
                  <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Team Leader評分：{e.leader_score} 分</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leader fields if exist */}
      {(r.leader_comment || r.leader_next_year_expectation) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          {r.leader_comment && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">💬 鼓勵說話</div>
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.leader_comment}</p>
            </div>
          )}
          {r.leader_next_year_expectation && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">🎯 來年工作期望及學習方向</div>
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.leader_next_year_expectation}</p>
            </div>
          )}
        </div>
      )}

      {scoredProjects.length === 0 && scoredExtras.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">此員工尚未為任何項目或額外貢獻自評分數。</div>
      )}
    </div>
  );
}