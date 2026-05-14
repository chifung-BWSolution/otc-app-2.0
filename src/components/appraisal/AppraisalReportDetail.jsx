import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, CheckCircle2, FileText, Save } from "lucide-react";
import BossNotesSection from "@/components/annual-review/BossNotesSection";
import BossProjectFields from "@/components/annual-review/BossProjectFields";
import ReportContentDisplay from "./ReportContentDisplay";
import SignAndDownloadSection from "./SignAndDownloadSection";
import { calcSectionScore, calcAttendanceAdj, calcMeritAdj, f2 } from "@/components/annual-review/ScoringBreakdown";
import { getTeamWeights, calcGpScore, calcSkillScore } from "@/lib/scoringConfig";

export default function AppraisalReportDetail({ report, onBack, onUpdated }) {
  const [r, setR] = useState(report);
  const [confirming, setConfirming] = useState(false);
  const [annualReview, setAnnualReview] = useState(null);
  const [bossDeptGoals, setBossDeptGoals] = useState([]);
  const [bossPersonalGoals, setBossPersonalGoals] = useState([]);
  const [bossExtraNotes, setBossExtraNotes] = useState("");
  const [gpFields, setGpFields] = useState([]);
  const [tenderFields, setTenderFields] = useState([]);
  const [gpDisabled, setGpDisabled] = useState(false);
  const [tenderDisabled, setTenderDisabled] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (report.annual_review_id) {
      base44.entities.AnnualReview.filter({ id: report.annual_review_id }, "id", 1)
        .then(res => {
          if (res.length > 0) {
            const ar = res[0];
            setAnnualReview(ar);
            setBossDeptGoals(ar.boss_dept_goals || []);
            setBossPersonalGoals(ar.boss_personal_goals || []);
            setBossExtraNotes(ar.boss_extra_notes || "");
            setGpFields(ar.boss_gp_fields || []);
            setTenderFields(ar.boss_tender_fields || []);
            setGpDisabled(ar.boss_gp_disabled || false);
            setTenderDisabled(ar.boss_tender_disabled || false);
          }
        })
        .catch(() => {});
    }
  }, [report.annual_review_id]);

  const computeTotalScore = async () => {
    if (!annualReview) return null;
    // Determine team group
    let teamGroup = null;
    const staffList = await base44.entities.Staff.filter({ bubble_id: r.staff_id }, "id", 1);
    if (staffList.length > 0) teamGroup = staffList[0].team_group || null;
    const weights = getTeamWeights(teamGroup);

    const projects = annualReview.project_contributions || [];
    const extras = annualReview.extra_contributions || [];
    const projResult = calcSectionScore(projects, weights.project);
    const extraResult = calcSectionScore(extras, weights.extra);
    const skillResult = calcSkillScore(annualReview.skill_scores, weights.skill, annualReview.skill_self_scores);
    const gpResult = weights.gp > 0 ? calcGpScore(annualReview.boss_gp_fields, annualReview.boss_gp_score, weights.gp) : { score: 0 };
    const baseScore = projResult.score + extraResult.score + skillResult.score + gpResult.score;

    // Attendance
    let attAdj = 0;
    try {
      const statsRes = await base44.functions.invoke('loadAttendanceStats', { staff_id: r.staff_id, fiscal_year: r.fiscal_year });
      const attResult = calcAttendanceAdj(statsRes.data.attendanceStats || null);
      attAdj = attResult.total;
      // Merits
      const meritTypes = await base44.entities.MeritDemeritType.filter({ is_active: true }, "sort_order", 100);
      const meritResult = calcMeritAdj(statsRes.data.meritRecords || [], meritTypes);
      attAdj += meritResult.adj;
    } catch {}

    const bossAdj = annualReview.boss_score_adjustment || 0;
    return Math.round((baseScore + attAdj + bossAdj) * 100) / 100;
  };

  const handleConfirm = async () => {
    setConfirming(true);
    if (annualReview) {
      await base44.entities.AnnualReview.update(annualReview.id, {
        boss_dept_goals: bossDeptGoals.filter(g => g.trim()),
        boss_personal_goals: bossPersonalGoals.filter(g => g.trim()),
        boss_extra_notes: bossExtraNotes,
        boss_gp_fields: gpFields,
        boss_tender_fields: tenderFields,
        boss_gp_disabled: gpDisabled,
        boss_tender_disabled: tenderDisabled,
      });
    }
    // Calculate total score
    const totalScore = await computeTotalScore();

    // Also update report_content with latest GP/tender data
    const updatedContent = updateReportGpTender(r.report_content, gpFields, tenderFields, gpDisabled, tenderDisabled);
    const updateData = { is_final: true, report_content: updatedContent };
    if (totalScore !== null) {
      updateData.total_score = totalScore;
      updateData.scoring_completed = true;
    }
    await base44.entities.AppraisalReport.update(r.id, updateData);
    const updated = { ...r, ...updateData };
    setR(updated);
    onUpdated(updated);
    setConfirming(false);
  };

  const handleSaveNotes = async () => {
    if (!annualReview) return;
    setSavingNotes(true);
    await base44.entities.AnnualReview.update(annualReview.id, {
      boss_dept_goals: bossDeptGoals.filter(g => g.trim()),
      boss_personal_goals: bossPersonalGoals.filter(g => g.trim()),
      boss_extra_notes: bossExtraNotes,
      boss_gp_fields: gpFields,
      boss_tender_fields: tenderFields,
      boss_gp_disabled: gpDisabled,
      boss_tender_disabled: tenderDisabled,
    });
    // Update report_content too
    const updatedContent = updateReportGpTender(r.report_content, gpFields, tenderFields, gpDisabled, tenderDisabled);
    await base44.entities.AppraisalReport.update(r.id, { report_content: updatedContent });
    setR(prev => ({ ...prev, report_content: updatedContent }));
    setSavingNotes(false);
  };

  return (
    <div className="max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{r.staff_name} 年度面談報告</h2>
          <p className="text-xs text-gray-400">
            {r.staff_position} · {r.staff_team} · {r.fiscal_year} · 版本 v{r.version}
          </p>
        </div>
        {r.scoring_completed ? (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> 已評分 ({r.total_score}分)
          </span>
        ) : r.is_final ? (
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">報告已確認</span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <FileText size={12} /> 草稿
          </span>
        )}
      </div>

      {/* Report content — structured display */}
      <ReportContentDisplay content={r.report_content} staffName={r.staff_name} staffId={r.staff_id} fiscalYear={r.fiscal_year} annualReview={annualReview} />

      {/* GP & Tender fields — editable before confirm */}
      {!r.is_final && (
        <BossProjectFields
          gpFields={gpFields}
          tenderFields={tenderFields}
          onGpChange={setGpFields}
          onTenderChange={setTenderFields}
          gpDisabled={gpDisabled}
          tenderDisabled={tenderDisabled}
          onGpDisabledChange={setGpDisabled}
          onTenderDisabledChange={setTenderDisabled}
        />
      )}
      {r.is_final && (
        <BossProjectFields
          gpFields={gpFields}
          tenderFields={tenderFields}
          gpDisabled={gpDisabled}
          tenderDisabled={tenderDisabled}
          readOnly
        />
      )}

      {/* Boss notes — editable before confirm */}
      {!r.is_final && (
        <>
          <BossNotesSection
            deptGoals={bossDeptGoals}
            personalGoals={bossPersonalGoals}
            extraNotes={bossExtraNotes}
            onDeptGoalsChange={setBossDeptGoals}
            onPersonalGoalsChange={setBossPersonalGoals}
            onExtraNotesChange={setBossExtraNotes}
          />
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {savingNotes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              儲存
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md"
            >
              {confirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              確認報告 OK
            </button>
          </div>
        </>
      )}

      {/* Boss notes readonly after confirm */}
      {r.is_final && (bossDeptGoals.length > 0 || bossPersonalGoals.length > 0 || bossExtraNotes) && (
        <BossNotesReadonly deptGoals={bossDeptGoals} personalGoals={bossPersonalGoals} extraNotes={bossExtraNotes} />
      )}

      {/* Sign & Download PDF — after confirmed */}
      {r.is_final && (
        <SignAndDownloadSection report={r} onPdfSaved={(url) => {
          const updated = { ...r, pdf_url: url };
          setR(updated);
          onUpdated(updated);
        }} />
      )}
    </div>
  );
}

function updateReportGpTender(content, gpFields, tenderFields, gpDisabled, tenderDisabled) {
  try {
    const data = JSON.parse(content);
    data.gpFields = gpFields;
    data.tenderFields = tenderFields;
    data.gpDisabled = gpDisabled;
    data.tenderDisabled = tenderDisabled;
    return JSON.stringify(data);
  } catch {
    return content;
  }
}

function BossNotesReadonly({ deptGoals, personalGoals, extraNotes }) {
  return (
    <div className="space-y-4">
      {deptGoals?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100">
            <h3 className="font-bold text-base text-cyan-800">🏢 未來部門目標</h3>
          </div>
          <div className="p-4 space-y-1.5">
            {deptGoals.map((g, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm font-bold text-cyan-600 shrink-0">{i + 1}.</span>
                <p className="text-sm text-gray-700">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {personalGoals?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-violet-50 px-4 py-3 border-b border-violet-100">
            <h3 className="font-bold text-base text-violet-800">🎯 公司設定個人目標</h3>
          </div>
          <div className="p-4 space-y-1.5">
            {personalGoals.map((g, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm font-bold text-violet-600 shrink-0">{i + 1}.</span>
                <p className="text-sm text-gray-700">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {extraNotes && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-bold text-base text-gray-700">📝 其它補充</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{extraNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}