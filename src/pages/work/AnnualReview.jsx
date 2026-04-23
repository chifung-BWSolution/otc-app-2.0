import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import AnnualReviewForm from "@/components/annual-review/AnnualReviewForm";

// Fiscal year: April 1 - March 31
// Employees fill in the LAST (previous) fiscal year's review
function getLastFY() {
  const now = new Date();
  const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const year = currentFYStart - 1;
  return { label: `FY${year}/${year + 1}`, start: `${year}-04-01`, end: `${year + 1}-03-31` };
}

async function loadAll(entity, sort = "id", batchSize = 5000) {
  const all = [];
  let offset = 0;
  while (true) {
    let batch;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        batch = await entity.filter({}, sort, batchSize, offset);
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [staffRec, setStaffRec] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [projectSummary, setProjectSummary] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fy = getLastFY();

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);

    if (!me.linked_staff_id) {
      setLoading(false);
      return;
    }

    const staffList = await base44.entities.Staff.filter({ bubble_id: me.linked_staff_id }, "id", 1);
    const staff = staffList[0] || null;
    setStaffRec(staff);

    const reviews = await base44.entities.AnnualReview.filter({
      staff_id: me.linked_staff_id,
      fiscal_year: fy.label,
    }, "-created_date", 1);
    if (reviews.length > 0) {
      setExistingReview(reviews[0]);
    }

    // Load lookup tables (stagger to avoid 502)
    const [taskTypeList, nosTaskList] = await Promise.all([
      base44.entities.NOSTaskType.filter({}, "display", 200),
      loadAll(base44.entities.NOSTask, "display"),
    ]);
    const projectList = await loadAll(base44.entities.BubbleProject, "display_name");
    const allDates = await loadAll(base44.entities.BubbleManHourDate, "-report_date");

    const projectMap = {};
    for (const p of projectList) { if (p.bubble_id) projectMap[p.bubble_id] = p; }
    const taskTypeMap = {};
    for (const t of taskTypeList) { if (t.bubble_id) taskTypeMap[t.bubble_id] = t; }
    const nosTaskMap = {};
    for (const t of nosTaskList) { if (t.bubble_id) nosTaskMap[t.bubble_id] = t; }

    const myDates = allDates.filter(d => {
      if (d.staff_id !== me.linked_staff_id) return false;
      const rd = toLocalDate(d.report_date);
      return rd && rd >= fy.start && rd <= fy.end;
    });
    const myDateIds = new Set(myDates.map(d => d.bubble_id).filter(Boolean));

    const allTasks = await loadAll(base44.entities.BubbleManHourTask, "-created_date");
    const myTasks = allTasks.filter(t => myDateIds.has(t.man_hour_date_id));

    // Resolve helpers
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

    // Aggregate by project with nested task type → task breakdown
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

    // Merge saved sales/notes from existing review
    if (reviews.length > 0 && reviews[0].project_contributions) {
      const savedMap = {};
      for (const s of reviews[0].project_contributions) { savedMap[s.project_name] = s; }
      for (const p of summary) {
        const s = savedMap[p.project_name];
        if (s) {
          p.sales_amount = s.sales_amount || 0;
          p.contribution_note = s.contribution_note || "";
        }
      }
    }

    setProjectSummary(summary);
    setLoading(false);
  };

  const handleSave = async (formData, isSubmit) => {
    setSaving(true);
    const payload = {
      staff_id: user.linked_staff_id,
      staff_name: staffRec?.display_name || user.full_name || "",
      staff_team: staffRec?.team_name || "",
      staff_bu: staffRec?.bu_name || "",
      staff_position: staffRec?.position || "",
      fiscal_year: fy.label,
      project_contributions: formData.project_contributions,
      challenges: formData.challenges,
      next_year_goals: formData.next_year_goals,
      company_feedback: formData.company_feedback,
      status: isSubmit ? "submitted" : "draft",
      ...(isSubmit ? { submitted_at: new Date().toISOString() } : {}),
    };

    if (existingReview) {
      await base44.entities.AnnualReview.update(existingReview.id, payload);
      setExistingReview({ ...existingReview, ...payload });
    } else {
      const created = await base44.entities.AnnualReview.create(payload);
      setExistingReview(created);
    }
    setSaving(false);
    if (isSubmit) setSubmitted(true);
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

  if (submitted || existingReview?.status === "submitted") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">年度工作表現評估表已提交</h2>
        <p className="text-sm text-gray-500">{fy.label} · {staffRec?.display_name || user.full_name}</p>
        <p className="text-sm text-gray-400">提交時間：{existingReview?.submitted_at ? new Date(existingReview.submitted_at).toLocaleString("zh-HK") : "剛剛"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <FileText size={24} />
          <div>
            <h2 className="text-lg font-bold">年度工作表現評估表</h2>
            <p className="text-sm opacity-80">{fy.label} · {staffRec?.display_name || user.full_name} · {staffRec?.team_name || ""} · {staffRec?.position || ""}</p>
          </div>
        </div>
      </div>

      <AnnualReviewForm
        projectSummary={projectSummary}
        existingReview={existingReview}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}