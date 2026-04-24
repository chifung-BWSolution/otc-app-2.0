import { useState, useEffect } from "react";
import { Save, Send, ChevronDown, ChevronRight, Loader2, Plus, X } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const INITIAL_SHOW = 10;

// Parse contribution_note: could be JSON array string or plain text
function parsePoints(note) {
  if (!note) return [""];
  try {
    const arr = JSON.parse(note);
    if (Array.isArray(arr)) return arr.length > 0 ? arr : [""];
  } catch {}
  // Legacy plain text → single point
  return [note];
}

function serializePoints(points) {
  const cleaned = points.filter(p => p.trim());
  return cleaned.length > 0 ? JSON.stringify(cleaned) : "";
}

export default function AnnualReviewForm({ projectSummary, existingReview, saving, onSave }) {
  const [projects, setProjects] = useState([]);
  const [challenges, setChallenges] = useState("");
  const [challengesSolution, setChallengesSolution] = useState("");
  const [goals, setGoals] = useState("");
  const [feedback, setFeedback] = useState("");
  const [otherContributions, setOtherContributions] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [showAll, setShowAll] = useState(false);
  // Per-project contribution points: { [projectIndex]: string[] }
  const [pointsMap, setPointsMap] = useState({});

  useEffect(() => {
    const mapped = projectSummary.map(p => ({ ...p }));
    setProjects(mapped);
    if (existingReview) {
      setChallenges(existingReview.challenges || "");
      setChallengesSolution(existingReview.challenges_solution || "");
      setGoals(existingReview.next_year_goals || "");
      setFeedback(existingReview.company_feedback || "");
      setOtherContributions(existingReview.other_contributions || "");
    }
    // Init points from existing data
    const pm = {};
    mapped.forEach((p, i) => {
      pm[i] = parsePoints(p.contribution_note);
    });
    setPointsMap(pm);
  }, [projectSummary, existingReview]);

  // Filter projects: only show those with >= 40h
  const allIndices = projects.map((_, i) => i).filter(i => (projects[i].hours || 0) >= 40);
  const visibleIndices = showAll ? allIndices : allIndices.slice(0, INITIAL_SHOW);
  const hasMore = allIndices.length > INITIAL_SHOW && !showAll;

  // Auto-select first project
  useEffect(() => {
    if (allIndices.length > 0 && (selectedProject === null || !allIndices.includes(selectedProject))) {
      setSelectedProject(allIndices[0]);
    }
  }, [allIndices.length]);

  const updateProject = (idx, field, value) => {
    const next = [...projects];
    next[idx] = { ...next[idx], [field]: value };
    setProjects(next);
  };

  const updatePoint = (projIdx, pointIdx, value) => {
    const next = { ...pointsMap };
    const arr = [...(next[projIdx] || [""])];
    arr[pointIdx] = value;
    next[projIdx] = arr;
    setPointsMap(next);
    updateProject(projIdx, "contribution_note", serializePoints(arr));
  };

  const addPoint = (projIdx) => {
    const next = { ...pointsMap };
    const arr = [...(next[projIdx] || [])];
    arr.push("");
    next[projIdx] = arr;
    setPointsMap(next);
  };

  const removePoint = (projIdx, pointIdx) => {
    const next = { ...pointsMap };
    const arr = [...(next[projIdx] || [])];
    arr.splice(pointIdx, 1);
    if (arr.length === 0) arr.push("");
    next[projIdx] = arr;
    setPointsMap(next);
    updateProject(projIdx, "contribution_note", serializePoints(arr));
  };

  const getFormData = () => ({
    project_contributions: projects.map(p => ({
      project_name: p.project_name,
      project_id: p.project_id,
      hours: p.hours,
      tasks: p.tasks,
      sales_amount: p.sales_amount,
      contribution_note: p.contribution_note,
    })),
    other_contributions: otherContributions,
    challenges,
    challenges_solution: challengesSolution,
    next_year_goals: goals,
    company_feedback: feedback,
  });

  const totalHours = projects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks || 0), 0);
  const sel = selectedProject !== null ? projects[selectedProject] : null;
  const selPoints = selectedProject !== null ? (pointsMap[selectedProject] || [""]) : [];
  const maxHours = allIndices.length > 0 ? (projects[allIndices[0]]?.hours || 1) : 1;

  return (
    <div className="space-y-5">
      {/* Section 1: Project Contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-5 py-4 border-b border-blue-100">
          <h3 className="font-bold text-base text-blue-800">📊 第一部分：年度項目工作摘要</h3>
          <p className="text-sm text-blue-600 mt-0.5">
            左邊選擇項目查看任務明細，右邊填寫銷售數字及貢獻重點。
          </p>
        </div>

        <div className="p-5">
          {/* Summary */}
          <div className="flex gap-3 mb-5">
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-center flex-1 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{allIndices.length}</div>
              <div className="text-xs text-gray-500">參與項目</div>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-3 text-center flex-1 border border-green-100">
              <div className="text-2xl font-bold text-green-600">{Math.round(totalHours)}h</div>
              <div className="text-xs text-gray-500">總工時</div>
            </div>
            <div className="bg-purple-50 rounded-lg px-4 py-3 text-center flex-1 border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{totalTasks}</div>
              <div className="text-xs text-gray-500">總任務數</div>
            </div>
          </div>

          {/* Left-Right split */}
          <div className="flex flex-col lg:flex-row gap-4 min-h-[420px]">
            {/* Left: Project list + expandable task details */}
            <div className="lg:w-1/2 flex flex-col border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-sm font-bold text-gray-700">
                📁 項目列表（點擊展開任務明細）
              </div>
              <div className="flex-1 overflow-y-auto">
                {visibleIndices.map((projIdx) => {
                  const p = projects[projIdx];
                  const isActive = selectedProject === projIdx;
                  const hasFilled = p.sales_amount > 0 || (p.contribution_note && serializePoints(pointsMap[projIdx] || []) !== "");
                  return (
                    <div key={projIdx} className={`border-b border-gray-100 ${isActive ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"}`}>
                      {/* Project row — single click to select + toggle expand */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                        onClick={() => {
                          setSelectedProject(projIdx);
                          setExpandedTask(expandedTask === projIdx ? null : projIdx);
                        }}
                      >
                        <span className="text-gray-400 shrink-0">
                          {expandedTask === projIdx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{p.project_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{p.tasks} 個任務</div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                            <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${Math.min(100, (p.hours / maxHours) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-indigo-600">{p.hours}h</div>
                          {hasFilled && (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mt-1" title="已填寫" />
                          )}
                        </div>
                      </button>

                      {/* Expandable task details */}
                      {expandedTask === projIdx && p.tasksByType?.length > 0 && (
                        <div className="px-4 pb-3 ml-8 space-y-2.5 border-l-2 border-indigo-200">
                          {p.tasksByType.map((tt, j) => (
                            <div key={j}>
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[j % COLORS.length] }} />
                                <span className="flex-1">{tt.name}</span>
                                <span className="text-blue-600">{tt.hours}h</span>
                              </div>
                              <div className="ml-5 mt-1 space-y-0.5">
                                {tt.tasks.map((task, k) => (
                                  <div key={k} className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="flex-1">{task.name}{task.count > 1 ? ` ×${task.count}` : ""}</span>
                                    <span className="font-medium text-gray-600 shrink-0">{Math.round(task.hours * 10) / 10}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {hasMore && (
                  <button
                    className="w-full py-2.5 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
                    onClick={() => setShowAll(true)}
                  >
                    顯示更多（共 {allIndices.length} 個項目）
                  </button>
                )}
                {allIndices.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    本財政年度暫無項目記錄
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sales + contribution points */}
            <div className="lg:w-1/2 flex flex-col border border-gray-200 rounded-xl overflow-hidden">
              {sel && allIndices.includes(selectedProject) ? (
                <>
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <div className="text-sm font-bold text-gray-800 truncate">{sel.project_name}</div>
                    <div className="text-xs text-gray-500">{sel.hours}h · {sel.tasks} 個任務</div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {/* Sales */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">💰 銷售額 / 收入貢獻（如適用）</label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="輸入金額（如無可留空）"
                        value={sel.sales_amount || ""}
                        onChange={e => updateProject(selectedProject, "sales_amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {/* Contribution points */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">
                        📝 貢獻重點
                      </label>
                      <div className="space-y-2">
                        {selPoints.map((pt, pi) => (
                          <div key={pi} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 shrink-0 text-right">{pi + 1}.</span>
                            <input
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              placeholder={`第 ${pi + 1} 項貢獻重點...`}
                              value={pt}
                              onChange={e => updatePoint(selectedProject, pi, e.target.value)}
                            />
                            {selPoints.length > 1 && (
                              <button
                                onClick={() => removePoint(selectedProject, pi)}
                                className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {(
                        <button
                          onClick={() => addPoint(selectedProject)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                        >
                          <Plus size={13} /> 新增一項
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  ← 請從左側選擇項目
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1.5: Other Contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-teal-50 px-5 py-4 border-b border-teal-100">
          <h3 className="font-bold text-base text-teal-800">🏆 第二部分：其他對公司的貢獻 / 成就 / 創新 / 品牌升級</h3>
          <p className="text-sm text-teal-600 mt-0.5">請列出不在上述項目中的其他重要貢獻、成就、創新舉措或品牌提升事項。</p>
        </div>
        <div className="p-5">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            rows={5}
            placeholder="例如：推動了新的工作流程、獲得客戶特別表揚、完成品牌升級項目、引入創新技術方案等..."
            value={otherContributions}
            onChange={e => setOtherContributions(e.target.value)}
          />
        </div>
      </div>

      {/* Section 3: Challenges + Solution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-5 py-4 border-b border-orange-100">
          <h3 className="font-bold text-base text-orange-800">⚡ 第三部分：年度遇到的困難及解決方法</h3>
          <p className="text-sm text-orange-600 mt-0.5">請描述你在這一年工作中遇到的主要困難和挑戰，以及你如何解決。</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">遇到的困難</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              rows={4}
              placeholder="例如：跨部門溝通困難、工具不足、時間管理挑戰、技能缺口等..."
              value={challenges}
              onChange={e => setChallenges(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">如何解決</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              rows={4}
              placeholder="例如：主動協調各方會議、引入新工具提升效率、調整工作優先順序等..."
              value={challengesSolution}
              onChange={e => setChallengesSolution(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Goals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-50 px-5 py-4 border-b border-green-100">
          <h3 className="font-bold text-base text-green-800">🎯 第四部分：未來一年目標</h3>
          <p className="text-sm text-green-600 mt-0.5">請訂定你未來一年的工作目標和個人發展計劃。</p>
        </div>
        <div className="p-5">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
            rows={5}
            placeholder="例如：提升某項技能、完成某個項目、達成某個KPI指標、考取證書等..."
            value={goals}
            onChange={e => setGoals(e.target.value)}
          />
        </div>
      </div>

      {/* Section 5: Company Feedback */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-purple-50 px-5 py-4 border-b border-purple-100">
          <h3 className="font-bold text-base text-purple-800">💬 第五部分：對公司的意見</h3>
          <p className="text-sm text-purple-600 mt-0.5">對公司發展方向、管理方式、政策制度的意見和建議。</p>
        </div>
        <div className="p-5">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            rows={5}
            placeholder="例如：對內部流程的改善建議、對培訓制度的看法、對工作環境的意見等..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => onSave(getFormData(), false)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          儲存草稿
        </button>
        <button
          onClick={() => {
            if (window.confirm("確認提交年度評估表？提交後將無法修改。")) {
              onSave(getFormData(), true);
            }
          }}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          正式提交
        </button>
      </div>
    </div>
  );
}