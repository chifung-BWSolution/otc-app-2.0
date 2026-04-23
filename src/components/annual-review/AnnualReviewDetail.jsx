import { ArrowLeft } from "lucide-react";

export default function AnnualReviewDetail({ review, onBack }) {
  const r = review;
  const projects = r.project_contributions || [];
  const totalHours = projects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks || 0), 0);
  const totalSales = projects.reduce((s, p) => s + (p.sales_amount || 0), 0);

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-bold text-gray-900">{r.staff_name} 的年度評估表</h2>
          <p className="text-xs text-gray-400">{r.staff_position} · {r.staff_team} · {r.staff_bu} · {r.fiscal_year}</p>
        </div>
        {r.status === "submitted" ? (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">已提交</span>
        ) : (
          <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">草稿</span>
        )}
      </div>

      {/* Section 1: Projects */}
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
                  {p.sales_amount > 0 && (
                    <span className="text-xs text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>
                  )}
                </div>
                {p.contribution_note && (
                  <div className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1.5">
                    {(() => {
                      try {
                        const arr = JSON.parse(p.contribution_note);
                        if (Array.isArray(arr)) return (
                          <ul className="list-disc list-inside space-y-0.5">
                            {arr.map((pt, pi) => <li key={pi}>{pt}</li>)}
                          </ul>
                        );
                      } catch {}
                      return <p>{p.contribution_note}</p>;
                    })()}
                  </div>
                )}
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-xs">無項目記錄</div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Challenges */}
      <SectionCard color="orange" icon="⚡" title="年度遇到的困難" content={r.challenges} />

      {/* Section 3: Goals */}
      <SectionCard color="green" icon="🎯" title="未來一年目標" content={r.next_year_goals} />

      {/* Section 4: Company Feedback */}
      <SectionCard color="purple" icon="💬" title="對公司的意見" content={r.company_feedback} />

      {/* Meta */}
      {r.submitted_at && (
        <div className="text-xs text-gray-400 text-right pb-4">
          提交時間：{new Date(r.submitted_at).toLocaleString("zh-HK")}
        </div>
      )}
    </div>
  );
}

function SectionCard({ color, icon, title, content }) {
  const bgMap = { orange: "bg-orange-50", green: "bg-green-50", purple: "bg-purple-50" };
  const borderMap = { orange: "border-orange-100", green: "border-green-100", purple: "border-purple-100" };
  const textMap = { orange: "text-orange-800", green: "text-green-800", purple: "text-purple-800" };

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