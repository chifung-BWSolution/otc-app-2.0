import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Send, ChevronDown, ChevronRight, Loader2, CheckCircle2, Circle } from "lucide-react";
import ProjectDetailPanel from "./ProjectDetailPanel";
import PresetPicker from "./PresetPicker";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const INITIAL_SHOW = 10;

// Parse contribution_note: handles JSON array of {type,text} objects, plain strings, or legacy formats
function parsePoints(note) {
  if (!note) return [];
  try {
    const arr = JSON.parse(note);
    if (Array.isArray(arr)) {
      return arr.map(item => {
        if (typeof item === "string") return { type: "", text: item };
        if (typeof item === "object" && item !== null) return { type: String(item.type || ""), text: String(item.text || "") };
        return { type: "", text: String(item) };
      });
    }
  } catch {}
  if (typeof note === "string" && note.trim()) return [{ type: "", text: note }];
  return [];
}

function serializePoints(points) {
  const cleaned = points.filter(p => p.text?.trim() || p.type?.trim());
  return cleaned.length > 0 ? JSON.stringify(cleaned) : "";
}

export default function AnnualReviewForm({ projectSummary, existingReview, saving, onSave }) {
  const [projects, setProjects] = useState([]);
  const [challenges, setChallenges] = useState("");
  const [challengesSolution, setChallengesSolution] = useState("");
  const [goals, setGoals] = useState("");
  const [commitment, setCommitment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [otherContributions, setOtherContributions] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [pointsMap, setPointsMap] = useState({});
  const [scoresMap, setScoresMap] = useState({});
  const [contributionTypes, setContributionTypes] = useState([]);
  const [scoreLevels, setScoreLevels] = useState([]);
  const initializedRef = useRef(false);

  // Load lookup data once
  useEffect(() => {
    Promise.all([
      base44.entities.ContributionType.filter({ is_active: true }, "sort_order", 100),
      base44.entities.ScoreLevel.filter({ is_active: true }, "-score", 100),
    ]).then(([ct, sl]) => {
      setContributionTypes(ct);
      setScoreLevels(sl);
    });
  }, []);

  // Initialize form from projectSummary — only on first mount or when projectSummary changes
  useEffect(() => {
    if (projectSummary.length === 0) return;
    const mapped = projectSummary.map(p => ({ ...p }));
    setProjects(mapped);
    // Only set text fields on first init (not after save updates existingReview)
    if (!initializedRef.current && existingReview) {
      setChallenges(existingReview.challenges || "");
      setChallengesSolution(existingReview.challenges_solution || "");
      setGoals(existingReview.next_year_goals || "");
      setCommitment(existingReview.commitment || "");
      setFeedback(existingReview.company_feedback || "");
      setOtherContributions(existingReview.other_contributions || "");
    }
    const pm = {};
    const sm = {};
    mapped.forEach((p, i) => {
      pm[i] = parsePoints(p.contribution_note);
      sm[i] = p.self_score || null;
    });
    setPointsMap(pm);
    setScoresMap(sm);
    initializedRef.current = true;
  }, [projectSummary]);

  const allIndices = projects.map((_, i) => i).filter(i => (projects[i].hours || 0) >= 40);
  const visibleIndices = showAll ? allIndices : allIndices.slice(0, INITIAL_SHOW);
  const hasMore = allIndices.length > INITIAL_SHOW && !showAll;

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

  const updatePoint = (projIdx, pointIdx, field, value) => {
    const next = { ...pointsMap };
    const arr = [...(next[projIdx] || [])];
    arr[pointIdx] = { ...arr[pointIdx], [field]: value };
    next[projIdx] = arr;
    setPointsMap(next);
    updateProject(projIdx, "contribution_note", serializePoints(arr));
  };

  const addPoint = (projIdx) => {
    const next = { ...pointsMap };
    const arr = [...(next[projIdx] || [])];
    arr.push({ type: "", text: "" });
    next[projIdx] = arr;
    setPointsMap(next);
  };

  const removePoint = (projIdx, pointIdx) => {
    const next = { ...pointsMap };
    const arr = [...(next[projIdx] || [])];
    arr.splice(pointIdx, 1);
    next[projIdx] = arr;
    setPointsMap(next);
    updateProject(projIdx, "contribution_note", serializePoints(arr));
  };

  const updateScore = (projIdx, score) => {
    const next = { ...scoresMap };
    next[projIdx] = score;
    setScoresMap(next);
    updateProject(projIdx, "self_score", score);
  };

  const getFormData = () => ({
    project_contributions: projects.map(p => ({
      project_name: p.project_name,
      project_id: p.project_id,
      hours: p.hours,
      tasks: p.tasks,
      sales_amount: p.sales_amount,
      contribution_note: p.contribution_note,
      self_score: p.self_score,
    })),
    other_contributions: otherContributions,
    challenges,
    challenges_solution: challengesSolution,
    next_year_goals: goals,
    commitment,
    company_feedback: feedback,
  });

  const totalHours = projects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks || 0), 0);
  const sel = selectedProject !== null ? projects[selectedProject] : null;
  const selPoints = selectedProject !== null ? (pointsMap[selectedProject] || []) : [];
  const selScore = selectedProject !== null ? (scoresMap[selectedProject] || null) : null;
  const maxHours = allIndices.length > 0 ? (projects[allIndices[0]]?.hours || 1) : 1;

  const completedCount = allIndices.filter(i => {
    const pts = pointsMap[i] || [];
    return pts.some(p => p.text?.trim()) && scoresMap[i] > 0;
  }).length;

  return (
    <div className="space-y-5">
      {/* Section 1: Project Contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-5 py-4 border-b border-blue-100">
          <h3 className="font-bold text-base text-blue-800">📊 第一部分：年度項目工作摘要</h3>
          <p className="text-sm text-blue-600 mt-1">
            可為每個項目填寫銷售額、貢獻重點及自評分數（非必填，按需填寫即可）
          </p>
          <p className="text-xs text-blue-500/70 mt-1">⚠️ 以下只列出全年累計 40 小時或以上的項目。</p>
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
            <div className={`rounded-lg px-4 py-3 text-center flex-1 border ${completedCount === allIndices.length && allIndices.length > 0 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
              <div className={`text-2xl font-bold ${completedCount === allIndices.length && allIndices.length > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {completedCount}/{allIndices.length}
              </div>
              <div className="text-xs text-gray-500">已完成</div>
            </div>
          </div>

          {/* Left-Right split */}
          <div className="flex flex-col lg:flex-row gap-4 min-h-[520px]">
            {/* Left: Project list */}
            <div className="lg:w-[38%] flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                📁 選擇項目
              </div>
              <div className="flex-1 overflow-y-auto">
                {visibleIndices.map((projIdx) => {
                  const p = projects[projIdx];
                  const isActive = selectedProject === projIdx;
                  const points = pointsMap[projIdx] || [];
                  const hasFilled = points.some(pt => pt.text?.trim());
                  const hasScore = scoresMap[projIdx] > 0;
                  const isComplete = hasFilled && hasScore;
                  return (
                    <div key={projIdx}>
                      <button
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-l-[3px] ${
                          isActive ? "bg-indigo-50 border-l-indigo-500" : "border-l-transparent hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedProject(projIdx);
                          setExpandedTask(expandedTask === projIdx ? null : projIdx);
                        }}
                      >
                        {isComplete ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={16} className="text-gray-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate leading-tight">{p.project_name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-indigo-600">{p.hours}h</span>
                            <span className="text-xs text-gray-400">{p.tasks}任務</span>
                            {hasScore && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">{scoresMap[projIdx]}分</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 shrink-0">
                          {expandedTask === projIdx ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      </button>

                      {expandedTask === projIdx && p.tasksByType?.length > 0 && (
                        <div className="px-3 pb-2 ml-7 space-y-2 border-l-2 border-indigo-100">
                          {p.tasksByType.map((tt, j) => (
                            <div key={j}>
                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[j % COLORS.length] }} />
                                <span className="flex-1">{tt.name}</span>
                                <span className="text-blue-500">{tt.hours}h</span>
                              </div>
                              <div className="ml-4 mt-0.5 space-y-0">
                                {tt.tasks.map((task, k) => (
                                  <div key={k} className="flex items-center gap-1.5 text-[11px] text-gray-400 leading-relaxed">
                                    <span className="flex-1">{task.name}{task.count > 1 ? ` ×${task.count}` : ""}</span>
                                    <span className="text-gray-500 shrink-0">{Math.round(task.hours * 10) / 10}h</span>
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
                  <button className="w-full py-2.5 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors" onClick={() => setShowAll(true)}>
                    顯示更多（共 {allIndices.length} 個項目）
                  </button>
                )}
                {allIndices.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">本財政年度暫無項目記錄</div>
                )}
              </div>
            </div>

            {/* Right: Detail panel */}
            <div className="lg:w-[62%] flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
              <ProjectDetailPanel
                project={sel && allIndices.includes(selectedProject) ? sel : null}
                points={selPoints}
                score={selScore}
                contributionTypes={contributionTypes}
                scoreLevels={scoreLevels}
                onUpdateSales={(v) => updateProject(selectedProject, "sales_amount", v)}
                onUpdatePoint={(pi, field, value) => updatePoint(selectedProject, pi, field, value)}
                onAddPoint={() => addPoint(selectedProject)}
                onRemovePoint={(pi) => removePoint(selectedProject, pi)}
                onUpdateScore={(s) => updateScore(selectedProject, s)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Challenges */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-5 py-4 border-b border-orange-100">
          <h3 className="font-bold text-base text-orange-800">⚡ 第二部分：年度遇到的困難及需要公司協助的地方</h3>
          <p className="text-sm text-orange-600 mt-0.5">請描述你在這一年工作中遇到的主要困難和挑戰，以及需要公司提供什麼支援。</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">遇到的困難</label>
            <PresetPicker category="difficulty" value={challenges} onChange={setChallenges} />
            <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" rows={4}
              placeholder="可點選上方選項，或自行輸入..." value={challenges} onChange={e => setChallenges(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">需要公司協助的地方</label>
            <PresetPicker category="company_support" value={challengesSolution} onChange={setChallengesSolution} />
            <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" rows={4}
              placeholder="可點選上方選項，或自行輸入..." value={challengesSolution} onChange={e => setChallengesSolution(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Section 4: Goals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-50 px-5 py-4 border-b border-green-100">
          <h3 className="font-bold text-base text-green-800">🎯 第三部分：未來一年目標及為完成目標願意做的事</h3>
          <p className="text-sm text-green-600 mt-0.5">請訂定你未來一年的工作目標，以及你願意付出什麼努力去達成。</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">未來一年目標</label>
            <PresetPicker category="goal" value={goals} onChange={setGoals} />
            <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" rows={3}
              placeholder="可點選上方選項，或自行輸入..." value={goals} onChange={e => setGoals(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">為完成目標願意做的事</label>
            <PresetPicker category="commitment" value={commitment} onChange={setCommitment} />
            <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" rows={3}
              placeholder="可點選上方選項，或自行輸入..." value={commitment} onChange={e => setCommitment(e.target.value)} />
          </div>
        </div>
      </div>



      {/* Section 5: Company Feedback */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-purple-50 px-5 py-4 border-b border-purple-100">
          <h3 className="font-bold text-base text-purple-800">💬 第四部分：對公司的意見</h3>
          <p className="text-sm text-purple-600 mt-0.5">對公司發展方向、管理方式、政策制度的意見和建議。</p>
        </div>
        <div className="p-5">
          <textarea className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" rows={5}
            placeholder="例如：對內部流程的改善建議、對培訓制度的看法、對工作環境的意見等..." value={feedback} onChange={e => setFeedback(e.target.value)} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button onClick={() => onSave(getFormData(), false)} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
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
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          正式提交
        </button>
      </div>
    </div>
  );
}