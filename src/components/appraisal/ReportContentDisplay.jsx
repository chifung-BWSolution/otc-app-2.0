import ReactMarkdown from "react-markdown";
import BossProjectFields from "@/components/annual-review/BossProjectFields";

function parseContributionPoints(points) {
  if (!points || !Array.isArray(points)) return [];
  return points.map(pt => {
    if (typeof pt === "object" && pt.type) return `[${pt.type}] ${pt.text}`;
    if (typeof pt === "object" && pt.text) return pt.text;
    if (typeof pt === "string") return pt;
    return "";
  }).filter(s => s.trim());
}

export default function ReportContentDisplay({ content, staffName }) {
  // Try to parse as structured JSON; fallback to markdown
  let data = null;
  try {
    data = JSON.parse(content);
    if (!data.summary) data = null; // not structured format
  } catch {}

  if (!data) {
    // Fallback: render as markdown
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <ReactMarkdown className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed
          [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2
          [&>h2]:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2
          [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-3 [&>h3]:mb-1
          [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5
        ">
          {content || "（報告內容為空）"}
        </ReactMarkdown>
      </div>
    );
  }

  const { summary, projects, extras, challenges, challengesSolution, goals, commitment, leaderComment, leaderExpectation, gpFields, tenderFields, gpDisabled, tenderDisabled } = data;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <h3 className="font-bold text-base text-blue-800">📊 項目工作摘要</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-3 mb-4">
            <StatBadge color="blue" value={summary.projectCount} label="參與項目" />
            <StatBadge color="green" value={`${summary.totalHours}h`} label="總工時" />
            <StatBadge color="purple" value={summary.totalTasks} label="總任務數" />
            {summary.totalSales > 0 && <StatBadge color="yellow" value={`$${summary.totalSales.toLocaleString()}`} label="銷售額" />}
          </div>

          {/* GP & Tender readonly */}
          {(gpFields?.length > 0 || tenderFields?.length > 0) && (
            <div className="mb-4">
              <BossProjectFields gpFields={gpFields || []} tenderFields={tenderFields || []} gpDisabled={gpDisabled} tenderDisabled={tenderDisabled} readOnly />
            </div>
          )}

          {/* Projects grid */}
          {projects.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {projects.map((p, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold text-gray-800 flex-1 leading-tight">{p.name}</h4>
                    {p.avgScore && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">{p.avgScore}/5</span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mb-2">
                    <span className="text-blue-600 font-semibold">{p.hours}h</span>
                    <span>{p.tasks} 個任務</span>
                    {p.sales > 0 && <span className="text-yellow-600 font-semibold">${p.sales.toLocaleString()}</span>}
                  </div>
                  {p.points?.length > 0 && (
                    <ul className="space-y-1">
                      {parseContributionPoints(p.points).map((pt, pi) => (
                        <li key={pi} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Extra Contributions */}
      {extras?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-teal-50 px-4 py-3 border-b border-teal-100">
            <h3 className="font-bold text-base text-teal-800">🌟 額外貢獻（{extras.length} 項）</h3>
          </div>
          <div className="p-4 space-y-2">
            {extras.map((e, i) => (
              <div key={i} className="flex items-start gap-2 border border-gray-100 rounded-lg px-3 py-2.5">
                <span className="text-sm font-bold text-teal-600 shrink-0">{i + 1}.</span>
                <p className="text-sm text-gray-700 flex-1 leading-relaxed">{e.description}</p>
                {e.avgScore && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">{e.avgScore}/5</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges */}
      {(challenges || challengesSolution) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
            <h3 className="font-bold text-base text-orange-800">⚡ 年度遇到的困難及解決方法</h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">遇到的困難</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{challenges || "（未填寫）"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">需要公司協助</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{challengesSolution || "（未填寫）"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Goals */}
      {(goals || commitment) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <h3 className="font-bold text-base text-green-800">🎯 未來一年目標</h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">目標</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{goals || "（未填寫）"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">為完成目標願意做的事</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{commitment || "（未填寫）"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leader Feedback */}
      {(leaderComment || leaderExpectation) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="font-bold text-base text-blue-800">👤 Team Leader 回饋</h3>
          </div>
          <div className="p-4 space-y-3">
            {leaderComment && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">💬 鼓勵說話</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{leaderComment}</p>
              </div>
            )}
            {leaderExpectation && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">🎯 來年期望</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{leaderExpectation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ color, value, label }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-600",
  };
  return (
    <div className={`rounded-lg px-3 py-2 text-center flex-1 border ${colors[color]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}