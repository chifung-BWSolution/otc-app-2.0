import { ArrowLeft, CheckCircle } from "lucide-react";

export default function AnnualReviewReadonly({ review, staffRec, user, onBack }) {
  const r = review;
  const projects = r.project_contributions || [];
  const totalHours = projects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks || 0), 0);
  const totalSales = projects.reduce((s, p) => s + (p.sales_amount || 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{r.fiscal_year} 年度工作表現評估表</h2>
          <p className="text-xs text-gray-400">{staffRec?.display_name || user?.full_name} · {r.staff_team} · {r.staff_position}</p>
        </div>
        {(() => {
          const statusMap = {
            draft: { label: "草稿", color: "bg-orange-100 text-orange-700" },
            peer_review_pending: { label: "待完成同事互評", color: "bg-amber-100 text-amber-700" },
            pending_leader: { label: "待Leader評分", color: "bg-blue-100 text-blue-700" },
            pending_boss: { label: "待老闆面談", color: "bg-purple-100 text-purple-700" },
          };
          const st = statusMap[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };
          return (
            <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${st.color}`}>
              <CheckCircle size={12} /> {st.label}
            </span>
          );
        })()}
      </div>

      {/* Project summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <h3 className="font-bold text-sm text-blue-800">📊 項目工作摘要</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-center flex-1 border border-blue-100">
              <div className="text-lg font-bold text-blue-600">{projects.length}</div>
              <div className="text-[10px] text-gray-500">參與項目</div>
            </div>
            <div className="bg-green-50 rounded-lg px-3 py-2 text-center flex-1 border border-green-100">
              <div className="text-lg font-bold text-green-600">{Math.round(totalHours)}h</div>
              <div className="text-[10px] text-gray-500">總工時</div>
            </div>
            <div className="bg-purple-50 rounded-lg px-3 py-2 text-center flex-1 border border-purple-100">
              <div className="text-lg font-bold text-purple-600">{totalTasks}</div>
              <div className="text-[10px] text-gray-500">總任務數</div>
            </div>
            {totalSales > 0 && (
              <div className="bg-yellow-50 rounded-lg px-3 py-2 text-center flex-1 border border-yellow-100">
                <div className="text-lg font-bold text-yellow-600">${totalSales.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500">銷售額</div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {projects.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 flex-1">{p.project_name}</span>
                  <span className="text-xs text-blue-600 font-bold">{p.hours}h</span>
                  <span className="text-xs text-gray-400">{p.tasks}個任務</span>
                  {p.sales_amount > 0 && <span className="text-xs text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>}
                </div>
                {p.self_score > 0 && (
                  <div className="mt-1.5">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">自評：{p.self_score} 分</span>
                  </div>
                )}
                {p.contribution_note && (
                  <div className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1.5">
                    {(() => {
                      try {
                        const arr = JSON.parse(p.contribution_note);
                        if (Array.isArray(arr)) return (
                          <ul className="list-disc list-inside space-y-0.5">
                            {arr.map((pt, pi) => {
                              if (typeof pt === "object" && pt.type) {
                                return <li key={pi}><span className="font-semibold text-gray-600">[{pt.type}]</span> {pt.text}</li>;
                              }
                              return <li key={pi}>{typeof pt === "string" ? pt : pt.text || ""}</li>;
                            })}
                          </ul>
                        );
                      } catch {}
                      return <p>{p.contribution_note}</p>;
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges + Solution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
          <h3 className="font-bold text-sm text-orange-800">⚡ 年度遇到的困難及解決方法</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">遇到的困難</div>
            {r.challenges ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.challenges}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">（未填寫）</p>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">如何解決</div>
            {r.challenges_solution ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.challenges_solution}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">（未填寫）</p>
            )}
          </div>
        </div>
      </div>
      {/* Goals + Commitment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-50 px-4 py-3 border-b border-green-100">
          <h3 className="font-bold text-sm text-green-800">🎯 未來一年目標及為完成目標願意做的事</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">未來一年目標</div>
            {r.next_year_goals ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.next_year_goals}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">（未填寫）</p>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">為完成目標願意做的事</div>
            {r.commitment ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.commitment}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">（未填寫）</p>
            )}
          </div>
        </div>
      </div>
      <SectionCard color="purple" icon="💬" title="對公司的意見" content={r.company_feedback} />

      {r.submitted_at && (
        <div className="text-xs text-gray-400 text-right pb-4">
          提交時間：{new Date(r.submitted_at).toLocaleString("zh-HK")}
        </div>
      )}
    </div>
  );
}

function SectionCard({ color, icon, title, content }) {
  const bgMap = { teal: "bg-teal-50", orange: "bg-orange-50", green: "bg-green-50", purple: "bg-purple-50" };
  const borderMap = { teal: "border-teal-100", orange: "border-orange-100", green: "border-green-100", purple: "border-purple-100" };
  const textMap = { teal: "text-teal-800", orange: "text-orange-800", green: "text-green-800", purple: "text-purple-800" };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`${bgMap[color]} px-4 py-3 border-b ${borderMap[color]}`}>
        <h3 className={`font-bold text-sm ${textMap[color]}`}>{icon} {title}</h3>
      </div>
      <div className="p-4">
        {content ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">（未填寫）</p>
        )}
      </div>
    </div>
  );
}