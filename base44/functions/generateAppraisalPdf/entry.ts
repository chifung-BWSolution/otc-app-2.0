import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Cache font in memory across invocations
let cachedFontB64 = null;

async function loadCJKFont(doc) {
  if (!cachedFontB64) {
    // Fetch Noto Sans SC TTF from CDN (real TTF, ~10MB, cached in Deno runtime)
    const url = "https://cdn.jsdelivr.net/npm/@electron-fonts/noto-sans-sc@1.2.0/fonts/NotoSansSC-Regular.ttf";
    console.log("Fetching CJK font from CDN...");
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Failed to fetch CJK font: " + resp.status);
    const buf = await resp.arrayBuffer();
    console.log("Font loaded, size:", buf.byteLength);
    
    // Convert to base64
    const bytes = new Uint8Array(buf);
    // Use Deno's built-in base64 encoding
    const encoder = new TextEncoder();
    // Build binary string in chunks to avoid stack overflow
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    cachedFontB64 = btoa(binary);
    console.log("Font converted to base64, length:", cachedFontB64.length);
  }
  
  doc.addFileToVFS("NotoSansSC-Regular.ttf", cachedFontB64);
  doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
}

// Helper: wrap text
function wrapText(doc, text, maxWidth) {
  if (!text) return [];
  const cleaned = text.replace(/\t/g, "  ");
  const paragraphs = cleaned.split("\n");
  const allLines = [];
  for (const para of paragraphs) {
    if (!para.trim()) { allLines.push(""); continue; }
    const lines = doc.splitTextToSize(para, maxWidth);
    allLines.push(...lines);
  }
  return allLines;
}

// Check page break
function checkPage(doc, y, needed, pageH, margin) {
  if (y + needed > pageH - margin) {
    doc.addPage();
    return margin + 5;
  }
  return y;
}

// Parse contribution points
function parsePoints(points) {
  if (!points || !Array.isArray(points)) return [];
  return points.map(pt => {
    if (typeof pt === "object" && pt.type) return `[${pt.type}] ${pt.text || ""}`;
    if (typeof pt === "object" && pt.text) return pt.text;
    if (typeof pt === "string") return pt;
    return "";
  }).filter(s => s.trim());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'management')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { report_id, staff_signature, boss_signature } = body;
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

    // Parse report content
    let data = null;
    try { data = JSON.parse(report.report_content); if (!data.summary) data = null; } catch {}

    // Create PDF and load CJK font
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    await loadCJKFont(doc);

    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const cW = pageW - margin * 2;
    const today = new Date().toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Hong_Kong" });

    const setCJK = (size) => {
      doc.setFont("NotoSansSC", "normal");
      doc.setFontSize(size);
    };

    let y = margin + 5;

    // ========== Title ==========
    setCJK(16);
    doc.setTextColor(30, 30, 80);
    doc.text("年度表現評估報告", pageW / 2, y, { align: "center" });
    y += 6;
    setCJK(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Annual Performance Appraisal Report", pageW / 2, y, { align: "center" });
    y += 10;

    // ========== Staff Info ==========
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    setCJK(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`員工：${report.staff_name || "N/A"}`, margin, y);
    doc.text(`職位：${report.staff_position || "N/A"}`, margin + 65, y);
    y += 5;
    doc.text(`Team：${report.staff_team || "N/A"}`, margin, y);
    doc.text(`BU：${report.staff_bu || "N/A"}`, margin + 65, y);
    doc.text(`財政年度：${report.fiscal_year || "N/A"}`, margin + 115, y);
    y += 5;
    doc.text(`報告版本：v${report.version || 1}`, margin, y);
    doc.text(`日期：${today}`, margin + 65, y);
    y += 3;
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ========== Helpers ==========
    const sectionTitle = (title) => {
      y = checkPage(doc, y, 12, pageH, margin);
      setCJK(11);
      doc.setTextColor(30, 50, 100);
      doc.text(title, margin, y);
      y += 2;
      doc.setDrawColor(180, 180, 220);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      doc.setTextColor(50, 50, 50);
    };

    const bodyText = (text, indent) => {
      if (!text) return;
      setCJK(9);
      doc.setTextColor(60, 60, 60);
      const x = margin + (indent || 0);
      const lines = wrapText(doc, text, cW - (indent || 0));
      for (const line of lines) {
        y = checkPage(doc, y, 5, pageH, margin);
        doc.text(line, x, y);
        y += 4.5;
      }
    };

    const labelText = (label) => {
      y = checkPage(doc, y, 6, pageH, margin);
      setCJK(9);
      doc.setTextColor(40, 40, 40);
      doc.text(label, margin, y);
      y += 5;
    };

    // ========== Project Summary ==========
    if (data?.summary) {
      sectionTitle("項目工作摘要");
      setCJK(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`總參與項目：${data.summary.projectCount}    總工時：${data.summary.totalHours}h    總任務數：${data.summary.totalTasks}`, margin, y);
      y += 5;
      if (data.summary.totalSales > 0) {
        doc.text(`總銷售額：$${data.summary.totalSales.toLocaleString()}`, margin, y);
        y += 5;
      }
      y += 3;

      // GP & Tender fields
      if (data.gpFields?.length > 0 && !data.gpDisabled) {
        for (const f of data.gpFields) {
          if (f.amount > 0) {
            doc.text(`  ${f.label}：$${f.amount.toLocaleString()}`, margin, y);
            y += 4.5;
          }
        }
        y += 2;
      }
      if (data.tenderFields?.length > 0 && !data.tenderDisabled) {
        for (const f of data.tenderFields) {
          if (f.count > 0) {
            doc.text(`  ${f.label}：${f.count}`, margin, y);
            y += 4.5;
          }
        }
        y += 2;
      }

      // Project details
      if (data.projects?.length > 0) {
        for (const p of data.projects) {
          y = checkPage(doc, y, 10, pageH, margin);
          setCJK(9);
          doc.setTextColor(30, 30, 30);
          let meta = `${p.hours}h · ${p.tasks} 個任務`;
          if (p.sales > 0) meta += ` · $${p.sales.toLocaleString()}`;
          if (p.avgScore) meta += ` · 綜合評分 ${p.avgScore}/5`;

          doc.text(`▸ ${p.name}`, margin + 2, y);
          y += 4.5;
          setCJK(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`  ${meta}`, margin + 4, y);
          y += 4.5;

          const pts = parsePoints(p.points);
          if (pts.length > 0) {
            setCJK(8);
            doc.setTextColor(70, 70, 70);
            for (const pt of pts) {
              const lines = wrapText(doc, `• ${pt}`, cW - 10);
              for (const line of lines) {
                y = checkPage(doc, y, 4.5, pageH, margin);
                doc.text(line, margin + 8, y);
                y += 4;
              }
            }
          }
          y += 2;
        }
      }
    }

    // ========== Extra Contributions ==========
    if (data?.extras?.length > 0) {
      sectionTitle("額外貢獻");
      for (const e of data.extras) {
        y = checkPage(doc, y, 6, pageH, margin);
        setCJK(9);
        doc.setTextColor(50, 50, 50);
        const line = e.avgScore ? `▸ ${e.description}（綜合評分 ${e.avgScore}/5）` : `▸ ${e.description}`;
        const lines = wrapText(doc, line, cW - 4);
        for (const l of lines) {
          y = checkPage(doc, y, 4.5, pageH, margin);
          doc.text(l, margin + 2, y);
          y += 4.5;
        }
      }
      y += 3;
    }

    // ========== Challenges ==========
    sectionTitle("年度遇到的困難及解決方法");
    labelText("遇到的困難：");
    bodyText(data?.challenges || annualReview?.challenges || "（未填寫）", 3);
    y += 2;
    labelText("需要公司協助：");
    bodyText(data?.challengesSolution || annualReview?.challenges_solution || "（未填寫）", 3);
    y += 3;

    // ========== Goals ==========
    sectionTitle("未來一年目標");
    labelText("目標：");
    bodyText(data?.goals || annualReview?.next_year_goals || "（未填寫）", 3);
    y += 2;
    labelText("為完成目標願意做的事：");
    bodyText(data?.commitment || annualReview?.commitment || "（未填寫）", 3);
    y += 3;

    // ========== Leader Feedback ==========
    const leaderComment = data?.leaderComment || annualReview?.leader_comment;
    const leaderExpectation = data?.leaderExpectation || annualReview?.leader_next_year_expectation;
    if (leaderComment || leaderExpectation) {
      sectionTitle("Team Leader 回饋");
      if (leaderComment) { labelText("鼓勵說話："); bodyText(leaderComment, 3); y += 2; }
      if (leaderExpectation) { labelText("來年期望："); bodyText(leaderExpectation, 3); y += 2; }
      y += 3;
    }

    // ========== Skill Scores ==========
    const SKILL_LABELS = {
      ai_application: "AI 應用能力", presentation: "演說及表達能力", training: "培訓能力",
      asana_update: "Asana 更新", teamwork: "團隊合作", problem_solving: "問題解決",
      time_management: "時間管理", initiative: "主動性", continuous_learning: "持續學習",
      leadership_potential: "領導潛力",
    };
    const skills = data?.skillScores || annualReview?.skill_scores;
    const selfSkills = annualReview?.skill_self_scores;
    if (skills?.length > 0 && skills.some(s => s.boss_score > 0)) {
      const scored = skills.filter(s => s.boss_score > 0);
      const overallAvg = Math.round((scored.reduce((a, s) => a + s.boss_score, 0) / scored.length) * 10) / 10;
      sectionTitle("工作技能評分");
      setCJK(9);
      for (const s of scored) {
        y = checkPage(doc, y, 5, pageH, margin);
        const label = SKILL_LABELS[s.key] || s.key;
        const selfS = selfSkills?.find(ss => ss.key === s.key)?.self_score;
        const vals = [];
        if (selfS > 0) vals.push(selfS);
        if (s.boss_score > 0) vals.push(s.boss_score);
        const itemAvg = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
        doc.text(`  ${label}：${itemAvg}/5`, margin, y);
        y += 5;
      }
      y += 2;
      setCJK(9);
      doc.setTextColor(30, 50, 100);
      doc.text(`  綜合平均分：${overallAvg}/5`, margin, y);
      doc.setTextColor(50, 50, 50);
      y += 6;
    }

    // ========== Boss Notes ==========
    const deptGoals = annualReview?.boss_dept_goals?.filter(g => g?.trim());
    const personalGoals = annualReview?.boss_personal_goals?.filter(g => g?.trim());
    const extraNotes = annualReview?.boss_extra_notes;
    if (deptGoals?.length > 0 || personalGoals?.length > 0 || extraNotes) {
      sectionTitle("公司目標及補充");
      if (deptGoals?.length > 0) {
        labelText("未來部門目標：");
        for (const g of deptGoals) { bodyText(`• ${g}`, 3); }
        y += 2;
      }
      if (personalGoals?.length > 0) {
        labelText("公司設定個人目標：");
        for (const g of personalGoals) { bodyText(`• ${g}`, 3); }
        y += 2;
      }
      if (extraNotes) { labelText("其它補充："); bodyText(extraNotes, 3); }
      y += 3;
    }

    // ========== Signature Page ==========
    doc.addPage();
    y = 30;

    setCJK(14);
    doc.setTextColor(30, 30, 80);
    doc.text("簽署確認", pageW / 2, y, { align: "center" });
    y += 12;

    setCJK(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`員工：${report.staff_name}    財政年度：${report.fiscal_year}`, margin + 5, y);
    y += 12;

    const sigW = 70;
    const sigH = 35;
    const col1X = margin + 10;
    const col2X = pageW / 2 + 10;

    setCJK(10);
    doc.setTextColor(50, 50, 50);
    doc.text("員工簽名", col1X, y);
    doc.text("老闆簽名", col2X, y);
    y += 5;

    // Add signature images if provided
    if (staff_signature) {
      try { doc.addImage(staff_signature, "PNG", col1X, y, sigW, sigH); } catch (e) { console.error("Staff sig error:", e); }
    }
    if (boss_signature) {
      try { doc.addImage(boss_signature, "PNG", col2X, y, sigW, sigH); } catch (e) { console.error("Boss sig error:", e); }
    }
    y += sigH + 3;

    // Signature lines
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(col1X, y, col1X + sigW, y);
    doc.line(col2X, y, col2X + sigW, y);
    y += 6;

    setCJK(9);
    doc.setTextColor(60, 60, 60);
    doc.text(report.staff_name || "", col1X, y);
    doc.text("Management", col2X, y);
    y += 8;
    doc.text(`日期：${today}`, col1X, y);
    doc.text(`日期：${today}`, col2X, y);

    // Generate PDF and upload to file storage
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = `Appraisal_${report.staff_name}_${report.fiscal_year}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    
    return Response.json({ file_url, file_name: fileName });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});