import { useState, useEffect } from "react";
import { Save, Send, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AnnualReviewForm({ projectSummary, existingReview, saving, onSave }) {
  const [projects, setProjects] = useState([]);
  const [challenges, setChallenges] = useState("");
  const [goals, setGoals] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    setProjects(projectSummary.map(p => ({ ...p })));
    if (existingReview) {
      setChallenges(existingReview.challenges || "");
      setGoals(existingReview.next_year_goals || "");
      setFeedback(existingReview.company_feedback || "");
    }
  }, [projectSummary, existingReview]);

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && selectedProject === null) setSelectedProject(0);
  }, [projects]);

  const updateProject = (idx, field, value) => {
    const next = [...projects];
    next[idx] = { ...next[idx], [field]: value };
    setProjects(next);
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
    challenges,
    next_year_goals: goals,
    company_feedback: feedback,
  });

  const totalHours = projects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks || 0), 0);
  const sel = selectedProject !== null ? projects[selectedProject] : null;
  const maxHours = projects[0]?.hours || 1;

  return (
    <div className="space-y-5">
      {/* Section 1: Project Contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-5 py-4 border-b border-blue-100">
          <h3 className="font-bold text-base text-blue-800">📊 第一部分：年度項目工作摘要</h3>
          <p className="text-sm text-blue-600 mt-0.5">
            左邊選擇項目查看任務明細，右邊填寫銷售數字及貢獻說明。
          </p>
        </div>

        <div className="p-5">
          {/* Summary */}
          <div className="flex gap-3 mb-5">
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-center flex-1 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
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
          <div className="flex flex-col lg:flex-row gap-4 min-h-[400px]">
            {/* Left: Project list */}
            <div className="lg:w-1/2 flex flex-col border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-sm font-bold text-gray-700">
                📁 項目列表
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {projects.map((p, i) => {
                  const isActive = selectedProject === i;
                  return (
                    <button
                      key={i}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? "bg-indigo-50 border-l-4 border-indigo-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                      onClick={() => setSelectedProject(i)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{p.project_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.tasks} 個任務</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                          <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${Math.min(100, (p.hours / maxHours) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-indigo-600">{p.hours}h</div>
                        {(p.sales_amount > 0 || p.contribution_note) && (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mt-1" title="已填寫" />
                        )}
                      </div>
                    </button>
                  );
                })}
                {projects.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    本財政年度暫無項目工時記錄
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected project detail + form */}
            <div className="lg:w-1/2 flex flex-col border border-gray-200 rounded-xl overflow-hidden">
              {sel ? (
                <>
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <div className="text-sm font-bold text-gray-800 truncate">{sel.project_name}</div>
                    <div className="text-xs text-gray-500">{sel.hours}h · {sel.tasks} 個任務</div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Task breakdown */}
                    {sel.tasksByType?.length > 0 && (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-700 mb-2">📋 任務明細</div>
                        <div className="space-y-2.5">
                          {sel.tasksByType.map((tt, j) => (
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
                      </div>
                    )}

                    {/* Form fields */}
                    <div className="px-4 py-4 space-y-3">
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
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">📝 貢獻說明</label>
                        <textarea
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          rows={4}
                          placeholder="描述你在此項目中的主要貢獻..."
                          value={sel.contribution_note || ""}
                          onChange={e => updateProject(selectedProject, "contribution_note", e.target.value)}
                        />
                      </div>
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

      {/* Section 2: Challenges */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-5 py-4 border-b border-orange-100">
          <h3 className="font-bold text-base text-orange-800">⚡ 第二部分：年度遇到的困難</h3>
          <p className="text-sm text-orange-600 mt-0.5">請描述你在這一年工作中遇到的主要困難和挑戰。</p>
        </div>
        <div className="p-5">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            rows={5}
            placeholder="例如：跨部門溝通困難、工具不足、時間管理挑戰、技能缺口等..."
            value={challenges}
            onChange={e => setChallenges(e.target.value)}
          />
        </div>
      </div>

      {/* Section 3: Goals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-50 px-5 py-4 border-b border-green-100">
          <h3 className="font-bold text-base text-green-800">🎯 第三部分：未來一年目標</h3>
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

      {/* Section 4: Company Feedback */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-purple-50 px-5 py-4 border-b border-purple-100">
          <h3 className="font-bold text-base text-purple-800">💬 第四部分：對公司的意見</h3>
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