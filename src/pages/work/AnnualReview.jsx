import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ArrowLeft, FileText, Users } from "lucide-react";
import AnnualReviewForm from "@/components/annual-review/AnnualReviewForm";
import AnnualReviewList from "@/components/annual-review/AnnualReviewList";
import AnnualReviewReadonly from "@/components/annual-review/AnnualReviewReadonly";
import PostSubmitPeerReview from "@/components/annual-review/PostSubmitPeerReview";
import SubordinateReviews from "@/components/annual-review/SubordinateReviews";

// Fiscal year: April 1 - March 31
// When creating new, fill the LAST (previous) fiscal year
function getLastFY() {
  const now = new Date();
  const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const year = currentFYStart - 1;
  return { label: `FY${year}/${year + 1}`, start: `${year}-04-01`, end: `${year + 1}-03-31` };
}

async function loadAll(entity, sort = "id", batchSize = 5000, filterQuery = {}) {
  const all = [];
  let offset = 0;
  while (true) {
    let batch;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        batch = await entity.filter(filterQuery, sort, batchSize, offset);
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
    await new Promise(r => setTimeout(r, 500));
  }
  return all;
}

// Load tasks that belong to a set of man_hour_date_ids
async function loadTasksForDates(dateIds) {
  if (dateIds.size === 0) return [];
  // RLS already scopes to user's own tasks; filter client-side by FY date ids
  const allMyTasks = await loadAll(base44.entities.BubbleManHourTask, "-created_date");
  return allMyTasks.filter(t => dateIds.has(t.man_hour_date_id));
}

const toLocalDate = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const cleaned = val.split(' ')[0];
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (val.includes('T')) {
    const d = new Date(val);
    const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    return hkt.toISOString().slice(0, 10);
  }
  return null;
};

export default function AnnualReview() {
  // Phase 1: List view
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [staffRec, setStaffRec] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("mine"); // mine | subordinates
  const [isLeader, setIsLeader] = useState(false);
  const [leaderName, setLeaderName] = useState("");

  // Phase 2: Form / readonly / peer-review view
  const [view, setView] = useState("list"); // list | form | readonly | peer-review
  const [activeReview, setActiveReview] = useState(null); // existing review being edited
  const [projectSummary, setProjectSummary] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFY, setActiveFY] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => { initList(); }, []);

  const initList = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    if (!me.linked_staff_id) { setLoading(false); return; }

    const [staffList, allReviews, allStaff] = await Promise.all([
      base44.entities.Staff.filter({ bubble_id: me.linked_staff_id }, "id", 1),
      base44.entities.AnnualReview.filter({ staff_id: me.linked_staff_id }, "-created_date", 50),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 2000),
    ]);
    const myStaff = staffList[0] || null;
    setStaffRec(myStaff);
    setReviews(allReviews);

    // Check if user has direct reports (staff whose team_leader is this user)
    if (myStaff) {
      const myId = myStaff.bubble_id;
      const hasSubs = allStaff.some(s => s.bubble_id !== myId && s.team_leader === myId);
      setIsLeader(hasSubs);
    }

    // Find this staff's team leader name
    if (myStaff?.team_leader) {
      const leader = allStaff.find(s => s.bubble_id === myStaff.team_leader);
      if (leader) setLeaderName(leader.display_name);
    }
    setLoading(false);
  };

  // Open review — draft → edit, peer_review_pending → peer review, anything else → readonly
  const handleOpenReview = (review) => {
    if (review.status === "draft") {
      loadFormData(review);
    } else if (review.status === "peer_review_pending") {
      // Go directly to peer review flow
      setView("peer-review");
    } else {
      setActiveReview(review);
      setView("readonly");
    }
  };

  // Create new form
  const handleCreateNew = () => {
    const fy = getLastFY();
    // Check if already exists for this FY
    const existing = reviews.find(r => r.fiscal_year === fy.label);
    if (existing) {
      if (existing.status !== "draft") {
        // Non-draft → show readonly
        setActiveReview(existing);
        setView("readonly");
        return;
      }
      // Draft exists, resume editing
      loadFormData(existing);
      return;
    }
    // No existing → new form
    loadFormData(null);
  };

  // Load heavy data for the form
  const loadFormData = async (existingReview) => {
    setFormLoading(true);
    setFormError(null);
    setView("form");
    setActiveReview(existingReview);

    const fy = existingReview?.fiscal_year
      ? parseFY(existingReview.fiscal_year)
      : getLastFY();
    setActiveFY(fy);

    try {
    // If existing review already has project_contributions, use them directly
    // (avoids RLS issues with BubbleManHourTask cross-collection queries for non-admin users)
    if (existingReview?.project_contributions?.length > 0) {
      const summary = existingReview.project_contributions.map(p => ({
        ...p,
        hours: p.hours || 0,
        tasks: p.tasks || 0,
        sales_amount: p.sales_amount || 0,
        contribution_note: p.contribution_note || "",
        self_score: p.self_score || null,
        tasksByType: [],
      }));
      setProjectSummary(summary);
    } else {
      // New form: load data via backend function (service role bypasses RLS)
      const res = await base44.functions.invoke('loadStaffManHourTasks', {
        staff_id: user.linked_staff_id,
        fy_start: fy.start,
        fy_end: fy.end,
      });
      const { tasks: myTasks, taskTypes: taskTypeList, nosTasks: nosTaskList, projects: projectList } = res.data;

      const projectMap = {};
      for (const p of projectList) { if (p.bubble_id) projectMap[p.bubble_id] = p; }
      const taskTypeMap = {};
      for (const t of taskTypeList) { if (t.bubble_id) taskTypeMap[t.bubble_id] = t; }
      const nosTaskMap = {};
      for (const t of nosTaskList) { if (t.bubble_id) nosTaskMap[t.bubble_id] = t; }

      const resolveProjectName = (t) => {
        if (t.project_name) return t.project_name;
        if (t.project_id && projectMap[t.project_id]) return projectMap[t.project_id].display_name;
        return "未指定項目";
      };
      const resolveTaskTypeName = (t) => {
        if (t.task_type_id && taskTypeMap[t.task_type_id]) return taskTypeMap[t.task_type_id].display;
        if (t.task_id && nosTaskMap[t.task_id]?.task_type_ids?.length) {
          const tt = taskTypeMap[nosTaskMap[t.task_id].task_type_ids[0]];
          if (tt) return tt.display;
        }
        return t.task_type_name || "未分類";
      };
      const resolveTaskName = (t) => {
        if (t.task_id && nosTaskMap[t.task_id]) return nosTaskMap[t.task_id].display;
        return t.task_name || t.keywords || "—";
      };

      const projAgg = {};
      for (const t of myTasks) {
        const projName = resolveProjectName(t);
        const projId = t.project_id || "";
        if (!projAgg[projName]) projAgg[projName] = { project_name: projName, project_id: projId, hours: 0, tasks: 0, sales_amount: 0, contribution_note: "", tasksByType: {} };
        projAgg[projName].hours += t.work_hour || 0;
        projAgg[projName].tasks += 1;
        const typeName = resolveTaskTypeName(t);
        if (!projAgg[projName].tasksByType[typeName]) projAgg[projName].tasksByType[typeName] = { name: typeName, hours: 0, taskMap: {} };
        projAgg[projName].tasksByType[typeName].hours += t.work_hour || 0;
        const tName = resolveTaskName(t);
        if (!projAgg[projName].tasksByType[typeName].taskMap[tName]) projAgg[projName].tasksByType[typeName].taskMap[tName] = { name: tName, hours: 0, count: 0 };
        projAgg[projName].tasksByType[typeName].taskMap[tName].hours += t.work_hour || 0;
        projAgg[projName].tasksByType[typeName].taskMap[tName].count += 1;
      }

      const summary = Object.values(projAgg)
        .map(p => ({
          ...p,
          hours: Math.round(p.hours * 10) / 10,
          tasksByType: Object.values(p.tasksByType)
            .map(tt => ({
              ...tt,
              hours: Math.round(tt.hours * 10) / 10,
              tasks: Object.values(tt.taskMap).sort((a, b) => b.hours - a.hours),
            }))
            .sort((a, b) => b.hours - a.hours),
        }))
        .sort((a, b) => b.hours - a.hours);

      setProjectSummary(summary);

      // Auto-create an empty draft immediately so user doesn't lose data
      if (!existingReview) {
        const draftPayload = {
          staff_id: user.linked_staff_id,
          staff_name: staffRec?.display_name || user.full_name || "",
          staff_team: staffRec?.team_name || "",
          staff_bu: staffRec?.bu_name || "",
          staff_position: staffRec?.position || "",
          leader_staff_id: staffRec?.team_leader || "",
          fiscal_year: fy.label,
          project_contributions: summary.map(p => ({
            project_name: p.project_name,
            project_id: p.project_id,
            hours: p.hours,
            tasks: p.tasks,
            sales_amount: p.sales_amount || 0,
            contribution_note: p.contribution_note || "",
            self_score: p.self_score || null,
          })),
          extra_contributions: [],
          status: "draft",
        };
        const created = await base44.entities.AnnualReview.create(draftPayload);
        setActiveReview(created);
        // Refresh list in background
        base44.entities.AnnualReview.filter({ staff_id: user.linked_staff_id }, "-created_date", 50).then(setReviews);
      }
    }
    } catch (err) {
      console.error("loadFormData error:", err);
      setFormError(err.message || "載入數據時發生錯誤");
    }
    setFormLoading(false);
  };

  const handleSave = async (formData, isSubmit) => {
    setSaving(true);
    const fy = activeFY || getLastFY();
    const payload = {
      staff_id: user.linked_staff_id,
      staff_name: staffRec?.display_name || user.full_name || "",
      staff_team: staffRec?.team_name || "",
      staff_bu: staffRec?.bu_name || "",
      staff_position: staffRec?.position || "",
      leader_staff_id: staffRec?.team_leader || "",
      fiscal_year: fy.label,
      project_contributions: formData.project_contributions,
      extra_contributions: formData.extra_contributions,
      challenges: formData.challenges,
      challenges_solution: formData.challenges_solution,
      next_year_goals: formData.next_year_goals,
      commitment: formData.commitment,
      company_feedback: formData.company_feedback,
      status: isSubmit ? "peer_review_pending" : "draft",
      ...(isSubmit ? { submitted_at: new Date().toISOString() } : {}),
    };

    let savedReview;
    if (activeReview) {
      await base44.entities.AnnualReview.update(activeReview.id, payload);
      savedReview = { ...activeReview, ...payload };
    } else {
      savedReview = await base44.entities.AnnualReview.create(payload);
    }

    // Update projectSummary with saved contribution data so form stays in sync
    const savedMap = {};
    for (const s of (payload.project_contributions || [])) { savedMap[s.project_name] = s; }
    const updatedSummary = projectSummary.map(p => {
      const s = savedMap[p.project_name];
      if (s) return { ...p, sales_amount: s.sales_amount || 0, contribution_note: s.contribution_note || "", self_score: s.self_score || null };
      return p;
    });
    setProjectSummary(updatedSummary);
    setActiveReview(savedReview);
    setSaving(false);

    // Refresh list
    const allReviews = await base44.entities.AnnualReview.filter({ staff_id: user.linked_staff_id }, "-created_date", 50);
    setReviews(allReviews);

    if (isSubmit) {
      setView("peer-review");
    }
  };

  const handleBack = () => {
    setView("list");
    setActiveReview(null);
    setProjectSummary([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <span className="ml-2 text-sm text-gray-400">載入年度評估表...</span>
      </div>
    );
  }

  if (!user?.linked_staff_id) {
    return (
      <div className="text-center py-20 text-gray-400">
        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">未找到關聯員工資料，請聯絡管理員。</p>
      </div>
    );
  }

  // Peer review view (after submitting annual review or clicking peer review button)
  if (view === "peer-review") {
    return <PostSubmitPeerReview staffRec={staffRec} onBack={handleBack} />;
  }

  // Readonly view for non-draft reviews
  if (view === "readonly" && activeReview) {
    return <AnnualReviewReadonly review={activeReview} staffRec={staffRec} user={user} onBack={handleBack} />;
  }

  // Form view (new or editing draft)
  if (view === "form") {
    if (formLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={32} />
          <span className="ml-2 text-sm text-gray-400">載入工時數據中...</span>
        </div>
      );
    }
    if (formError) {
      return (
        <div className="text-center py-20 space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-sm text-red-600">載入數據時發生錯誤：{formError}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleBack} className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200">返回</button>
            <button onClick={() => loadFormData(activeReview)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">重試</button>
          </div>
        </div>
      );
    }
    const fy = activeFY || getLastFY();
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white flex-1">
            <div className="flex items-center gap-3">
              <FileText size={24} />
              <div>
                <h2 className="text-lg font-bold">年度工作表現評估表</h2>
                <p className="text-sm opacity-80">{fy.label} · {staffRec?.display_name || user.full_name} · {staffRec?.team_name || ""} · {staffRec?.position || ""}</p>
              </div>
            </div>
          </div>
        </div>
        <AnnualReviewForm
          projectSummary={projectSummary}
          existingReview={activeReview}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    );
  }

  // Default: list view with tabs
  return (
    <div className="space-y-4">
      {/* Tabs — only show if user has subordinates */}
      {isLeader && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-md">
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "mine" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText size={14} /> 我的評估表
          </button>
          <button
            onClick={() => setTab("subordinates")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "subordinates" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users size={14} /> Team Member 評估表
          </button>
        </div>
      )}

      {tab === "mine" ? (
        <AnnualReviewList
          reviews={reviews}
          staffRec={staffRec}
          user={user}
          leaderName={leaderName}
          onCreateNew={handleCreateNew}
          onOpen={handleOpenReview}
          onPeerReview={() => setView("peer-review")}
        />
      ) : (
        <SubordinateReviews staffRec={staffRec} user={user} />
      )}
    </div>
  );
}

// Parse "FY2024/2025" → { label, start, end }
function parseFY(fyLabel) {
  const match = fyLabel.match(/FY(\d{4})\/(\d{4})/);
  if (!match) return getLastFY();
  const y = parseInt(match[1]);
  return { label: fyLabel, start: `${y}-04-01`, end: `${y + 1}-03-31` };
}