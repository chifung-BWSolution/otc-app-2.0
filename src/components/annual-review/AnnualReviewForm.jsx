import { useState, useEffect } from "react";
import { Save, Send, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

export default function AnnualReviewForm({ projectSummary, existingReview, saving, onSave }) {
  const [projects, setProjects] = useState([]);
  const [challenges, setChallenges] = useState("");
  const [goals, setGoals] = useState("");
  const [feedback, setFeedback] = useState("");
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    setProjects(projectSummary.map(p => ({ ...p })));
    if (existingReview) {
      setChallenges(existingReview.challenges || "");
      setGoals(existingReview.next_year_goals || "");
      setFeedback(existingReview.company_feedback || "");
    }
  }, [projectSummary, existingReview]);

  const updateProject = (idx, field, value) => {
    const next = [...projects];
    next[idx] = { ...next[idx], [field]: value };
    setProjects(next);
  };

  const getFormData = () => ({
    project_contributions: projects,
    challenges,
    next_year_goals: goals,
    company_feedback: feedback,
  });

  const totalHours = projects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks || 0), 0);

  return (
    <div className="space-y-4">
      {/* Section 1: Project Contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <h3 className="font-bold text-sm text-blue-800">📊 第一部分：年度項目工作摘要</h3>
          <p className="text-xs text-blue-600 mt-0.5">
            以下是你本財政年度的項目工時數據（自動匯總），請補充銷售數字或貢獻說明。
          </p>
        </div>

        <div className="p-4">
          {/* Summary */}
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
          </div>

          {/* Project rows */}
          <div className="space-y-2">
            {projects.map((p, i) => {
              const isOpen = expandedProject === i;
              return (
                <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                    onClick={() => setExpandedProject(isOpen ? null : i)}
                  >
                    <span className="text-gray-400 shrink-0">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{p.project_name}</span>
                    <span className="text-xs text-blue-600 font-bold shrink-0">{p.hours}h</span>
                    <span className="text-xs text-gray-400 shrink-0">{p.tasks}個任務</span>
                    {(p.sales_amount > 0 || p.contribution_note) && (
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="已填寫" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pt-1 bg-gray-50/50 space-y-2 border-t border-gray-100">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">💰 銷售額 / 收入貢獻（如適用）</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="輸入金額（如無可留空）"
                          value={p.sales_amount || ""}
                          onChange={e => updateProject(i, "sales_amount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">📝 貢獻說明</label>
                        <textarea
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          rows={2}
                          placeholder="描述你在此項目中的主要貢獻..."
                          value={p.contribution_note || ""}
                          onChange={e => updateProject(i, "contribution_note", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                本財政年度暫無項目工時記錄
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Challenges */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
          <h3 className="font-bold text-sm text-orange-800">⚡ 第二部分：年度遇到的困難</h3>
          <p className="text-xs text-orange-600 mt-0.5">請描述你在這一年工作中遇到的主要困難和挑戰。</p>
        </div>
        <div className="p-4">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            rows={5}
            placeholder="例如：跨部門溝通困難、工具不足、時間管理挑戰、技能缺口等..."
            value={challenges}
            onChange={e => setChallenges(e.target.value)}
          />
        </div>
      </div>

      {/* Section 3: Goals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-50 px-4 py-3 border-b border-green-100">
          <h3 className="font-bold text-sm text-green-800">🎯 第三部分：未來一年目標</h3>
          <p className="text-xs text-green-600 mt-0.5">請訂定你未來一年的工作目標和個人發展計劃。</p>
        </div>
        <div className="p-4">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
            rows={5}
            placeholder="例如：提升某項技能、完成某個項目、達成某個KPI指標、考取證書等..."
            value={goals}
            onChange={e => setGoals(e.target.value)}
          />
        </div>
      </div>

      {/* Section 4: Company Feedback */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
          <h3 className="font-bold text-sm text-purple-800">💬 第四部分：對公司的意見</h3>
          <p className="text-xs text-purple-600 mt-0.5">對公司發展方向、管理方式、政策制度的意見和建議。</p>
        </div>
        <div className="p-4">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
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