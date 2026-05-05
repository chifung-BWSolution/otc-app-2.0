import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Helper: wrap text and return lines
function wrapText(doc, text, maxWidth) {
  if (!text) return [];
  return doc.splitTextToSize(text, maxWidth);
}

// Helper: add a section title
function addSectionTitle(doc, y, title, pageW, margin) {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text(title, margin, y);
  y += 2;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  return y;
}

// Helper: add body text
function addBody(doc, y, text, maxWidth, margin) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const lines = wrapText(doc, text || "(not filled)", maxWidth);
  for (const line of lines) {
    if (y > 272) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 4.5;
  }
  return y + 2;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { report_id } = await req.json().catch(() => ({}));
    if (!report_id) return Response.json({ error: 'Missing report_id' }, { status: 400 });

    // Fetch report
    const reports = await base44.asServiceRole.entities.AppraisalReport.filter({ id: report_id }, "id", 1);
    if (reports.length === 0) return Response.json({ error: 'Report not found' }, { status: 404 });
    const report = reports[0];

    // Fetch annual review for boss notes
    let annualReview = null;
    if (report.annual_review_id) {
      const ars = await base44.asServiceRole.entities.AnnualReview.filter({ id: report.annual_review_id }, "id", 1);
      if (ars.length > 0) annualReview = ars[0];
    }

    // Fetch peer review stats
    let peerAvg = null;
    let peerCount = 0;
    const peerReviews = await base44.asServiceRole.entities.PeerReview.filter(
      { reviewee_staff_id: report.staff_id, fiscal_year: report.fiscal_year, status: "submitted" },
      "-created_date", 200
    );
    if (peerReviews.length > 0) {
      const dims = ["score_attitude", "score_professionalism", "score_teamwork", "score_problem_solving", "score_company_contribution"];
      const dimAvgs = dims.map(d => {
        const vals = peerReviews.map(r => r[d]).filter(v => v > 0);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }).filter(v => v > 0);
      peerAvg = dimAvgs.length > 0 ? Math.round((dimAvgs.reduce((a, b) => a + b, 0) / dimAvgs.length) * 10) / 10 : null;
      peerCount = peerReviews.length;
    }

    // Parse report content
    let data = null;
    try { data = JSON.parse(report.report_content); if (!data.summary) data = null; } catch {}

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 20;

    // === Title ===
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 80);
    doc.text("Annual Performance Appraisal Report", pageW / 2, y, { align: "center" });
    y += 10;

    // === Staff Info ===
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const infoLines = [
      `Staff: ${report.staff_name || "N/A"}`,
      `Position: ${report.staff_position || "N/A"}    Team: ${report.staff_team || "N/A"}    BU: ${report.staff_bu || "N/A"}`,
      `Fiscal Year: ${report.fiscal_year || "N/A"}    Report Version: v${report.version || 1}`,
    ];
    for (const line of infoLines) {
      doc.text(line, margin, y);
      y += 5;
    }
    y += 3;

    // === Project Summary ===
    if (data?.summary) {
      y = addSectionTitle(doc, y, "Project Work Summary", pageW, margin);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Projects: ${data.summary.projectCount}    Total Hours: ${data.summary.totalHours}h    Total Tasks: ${data.summary.totalTasks}`, margin, y);
      y += 5;
      if (data.summary.totalSales > 0) {
        doc.text(`Total Sales: $${data.summary.totalSales.toLocaleString()}`, margin, y);
        y += 5;
      }
      y += 2;

      // Project details
      if (data.projects?.length > 0) {
        for (const p of data.projects) {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(`- ${p.name}`, margin + 2, y);
          doc.setFont("helvetica", "normal");
          const meta = `  (${p.hours}h, ${p.tasks} tasks${p.sales > 0 ? `, $${p.sales.toLocaleString()}` : ""}${p.avgScore ? `, avg: ${p.avgScore}/5` : ""})`;
          doc.text(meta, margin + 2 + doc.getTextWidth(`- ${p.name}`), y);
          y += 5;

          // Contribution points
          if (p.points?.length > 0) {
            for (const pt of p.points) {
              if (y > 272) { doc.addPage(); y = 20; }
              const text = typeof pt === "object" ? (pt.type ? `[${pt.type}] ${pt.text}` : pt.text || "") : String(pt);
              if (text.trim()) {
                const lines = wrapText(doc, `  * ${text}`, contentW - 8);
                for (const line of lines) {
                  if (y > 272) { doc.addPage(); y = 20; }
                  doc.text(line, margin + 6, y);
                  y += 4;
                }
              }
            }
          }
          y += 1;
        }
      }
    }

    // === Extra Contributions ===
    if (data?.extras?.length > 0) {
      y = addSectionTitle(doc, y, "Extra Contributions", pageW, margin);
      for (const e of data.extras) {
        if (y > 272) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`- ${e.description}${e.avgScore ? ` (avg: ${e.avgScore}/5)` : ""}`, margin + 2, y);
        y += 5;
      }
      y += 2;
    }

    // === Challenges ===
    y = addSectionTitle(doc, y, "Annual Challenges & Solutions", pageW, margin);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Challenges:", margin, y); y += 5;
    y = addBody(doc, y, data?.challenges || annualReview?.challenges, contentW, margin);
    doc.setFont("helvetica", "bold");
    doc.text("Support Needed:", margin, y); y += 5;
    y = addBody(doc, y, data?.challengesSolution || annualReview?.challenges_solution, contentW, margin);

    // === Goals ===
    y = addSectionTitle(doc, y, "Next Year Goals & Commitment", pageW, margin);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Goals:", margin, y); y += 5;
    y = addBody(doc, y, data?.goals || annualReview?.next_year_goals, contentW, margin);
    doc.setFont("helvetica", "bold");
    doc.text("Commitment:", margin, y); y += 5;
    y = addBody(doc, y, data?.commitment || annualReview?.commitment, contentW, margin);

    // === Leader Feedback ===
    const leaderComment = data?.leaderComment || annualReview?.leader_comment;
    const leaderExpectation = data?.leaderExpectation || annualReview?.leader_next_year_expectation;
    if (leaderComment || leaderExpectation) {
      y = addSectionTitle(doc, y, "Team Leader Feedback", pageW, margin);
      if (leaderComment) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("Encouragement:", margin, y); y += 5;
        y = addBody(doc, y, leaderComment, contentW, margin);
      }
      if (leaderExpectation) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("Next Year Expectations:", margin, y); y += 5;
        y = addBody(doc, y, leaderExpectation, contentW, margin);
      }
    }

    // === Peer Review Summary ===
    if (peerAvg !== null) {
      y = addSectionTitle(doc, y, "Peer Review Summary", pageW, margin);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Submitted Reviews: ${peerCount}    Overall Average: ${peerAvg}/5`, margin, y);
      y += 8;
    }

    // === Skill Scores ===
    const skillScores = data?.skillScores || annualReview?.skill_scores;
    const skillSelfScores = annualReview?.skill_self_scores;
    if (skillScores?.length > 0) {
      y = addSectionTitle(doc, y, "Work Skill Scores", pageW, margin);
      const skillLabels = {
        ai_application: "AI Application",
        presentation: "Presentation",
        training: "Training",
        asana_update: "Asana Update",
        teamwork: "Teamwork",
        problem_solving: "Problem Solving",
        time_management: "Time Management",
        initiative: "Initiative",
        continuous_learning: "Continuous Learning",
        leadership_potential: "Leadership Potential",
      };
      doc.setFontSize(9);
      for (const s of skillScores) {
        if (y > 272) { doc.addPage(); y = 20; }
        const label = skillLabels[s.key] || s.key;
        const selfScore = skillSelfScores?.find(ss => ss.key === s.key)?.self_score || 0;
        let line = `- ${label}: `;
        if (selfScore > 0) line += `Self: ${selfScore}/5  `;
        if (s.boss_score > 0) line += `Boss: ${s.boss_score}/5`;
        if (!selfScore && !s.boss_score) line += "Not scored";
        doc.setFont("helvetica", "normal");
        doc.text(line, margin + 2, y);
        y += 5;
      }
      y += 2;
    }

    // === Boss Notes ===
    const deptGoals = annualReview?.boss_dept_goals?.filter(g => g?.trim());
    const personalGoals = annualReview?.boss_personal_goals?.filter(g => g?.trim());
    const extraNotes = annualReview?.boss_extra_notes;
    if (deptGoals?.length > 0 || personalGoals?.length > 0 || extraNotes) {
      y = addSectionTitle(doc, y, "Company Goals & Notes", pageW, margin);
      if (deptGoals?.length > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("Department Goals:", margin, y); y += 5;
        doc.setFont("helvetica", "normal");
        for (const g of deptGoals) {
          if (y > 272) { doc.addPage(); y = 20; }
          doc.text(`- ${g}`, margin + 2, y); y += 5;
        }
        y += 1;
      }
      if (personalGoals?.length > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("Personal Goals:", margin, y); y += 5;
        doc.setFont("helvetica", "normal");
        for (const g of personalGoals) {
          if (y > 272) { doc.addPage(); y = 20; }
          doc.text(`- ${g}`, margin + 2, y); y += 5;
        }
        y += 1;
      }
      if (extraNotes) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("Additional Notes:", margin, y); y += 5;
        y = addBody(doc, y, extraNotes, contentW, margin);
      }
    }

    // === Scoring Summary ===
    if (report.scoring_completed && report.total_score != null) {
      y = addSectionTitle(doc, y, "Scoring Summary", pageW, margin);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Score: ${report.total_score} / 100`, margin, y);
      y += 8;
    }

    // === Signature Section ===
    // Ensure enough space for signatures; if not, start new page
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, y, "Signatures", pageW, margin);
    y += 5;

    const sigW = (contentW - 15) / 3;
    const sigStartX = margin;
    const lineY = y + 25;

    const sigLabels = ["Staff", "Team Leader", "Management"];
    for (let i = 0; i < 3; i++) {
      const x = sigStartX + i * (sigW + 7.5);
      // Signature line
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(x, lineY, x + sigW, lineY);
      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(sigLabels[i], x + sigW / 2, lineY + 5, { align: "center" });
      // Date line
      doc.setFontSize(7);
      doc.text("Date: _______________", x + sigW / 2, lineY + 12, { align: "center" });
    }

    // Generate PDF bytes
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Appraisal_${report.staff_name}_${report.fiscal_year}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});