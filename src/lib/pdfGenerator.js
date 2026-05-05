import { jsPDF } from "jspdf";

// Font loading cache
let fontLoaded = false;
let fontLoadPromise = null;

// Load Noto Sans SC font for CJK support
async function loadCJKFont(pdf) {
  if (fontLoaded) return;
  if (fontLoadPromise) { await fontLoadPromise; return; }

  fontLoadPromise = (async () => {
    // Use a compact CJK font from Google Fonts — Noto Sans SC Regular
    const fontUrl = "https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts-subset@master/fonts/noto-sans-sc/NotoSansSC-Regular.ttf";
    const resp = await fetch(fontUrl);
    const buf = await resp.arrayBuffer();
    // Convert to base64
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    // Register font
    pdf.addFileToVFS("NotoSansSC-Regular.ttf", b64);
    pdf.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
    fontLoaded = true;
  })();
  await fontLoadPromise;
}

// Helper: wrap text to fit within maxWidth, returns array of lines
function wrapText(pdf, text, maxWidth) {
  if (!text) return [];
  // Replace tabs/excessive whitespace
  const cleaned = text.replace(/\t/g, "  ");
  const paragraphs = cleaned.split("\n");
  const allLines = [];
  for (const para of paragraphs) {
    if (!para.trim()) { allLines.push(""); continue; }
    const lines = pdf.splitTextToSize(para, maxWidth);
    allLines.push(...lines);
  }
  return allLines;
}

// Check page break, add new page if needed
function checkPage(pdf, y, needed, pageH, margin) {
  if (y + needed > pageH - margin) {
    pdf.addPage();
    return margin + 5;
  }
  return y;
}

// Parse contribution points from JSON
function parsePoints(points) {
  if (!points || !Array.isArray(points)) return [];
  return points.map(pt => {
    if (typeof pt === "object" && pt.type) return `[${pt.type}] ${pt.text || ""}`;
    if (typeof pt === "object" && pt.text) return pt.text;
    if (typeof pt === "string") return pt;
    return "";
  }).filter(s => s.trim());
}

export async function generateAppraisalPdf({ report, reportData, annualReview, staffSig, bossSig }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  await loadCJKFont(pdf);

  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const cW = pageW - margin * 2; // content width
  const today = new Date().toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit" });

  const setCJK = (size, style) => {
    pdf.setFont("NotoSansSC", "normal");
    pdf.setFontSize(size);
  };

  const setLatin = (size, style) => {
    pdf.setFont("helvetica", style || "normal");
    pdf.setFontSize(size);
  };

  let y = margin + 5;

  // ========== Title ==========
  setCJK(16);
  pdf.setTextColor(30, 30, 80);
  pdf.text("年度表現評估報告", pageW / 2, y, { align: "center" });
  y += 5;
  setLatin(10);
  pdf.text("Annual Performance Appraisal Report", pageW / 2, y, { align: "center" });
  y += 10;

  // ========== Staff Info ==========
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  setCJK(9);
  pdf.setTextColor(60, 60, 60);
  pdf.text(`員工：${report.staff_name || "N/A"}`, margin, y);
  pdf.text(`職位：${report.staff_position || "N/A"}`, margin + 60, y);
  y += 5;
  pdf.text(`Team：${report.staff_team || "N/A"}`, margin, y);
  pdf.text(`BU：${report.staff_bu || "N/A"}`, margin + 60, y);
  pdf.text(`財政年度：${report.fiscal_year || "N/A"}`, margin + 110, y);
  y += 5;
  pdf.text(`報告版本：v${report.version || 1}`, margin, y);
  pdf.text(`日期：${today}`, margin + 60, y);
  y += 3;
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  // ========== Helper: Section title ==========
  const sectionTitle = (title) => {
    y = checkPage(pdf, y, 12, pageH, margin);
    setCJK(11);
    pdf.setTextColor(30, 50, 100);
    pdf.text(title, margin, y);
    y += 2;
    pdf.setDrawColor(180, 180, 220);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
    pdf.setTextColor(50, 50, 50);
  };

  // ========== Helper: body text ==========
  const bodyText = (text, indent) => {
    if (!text) return;
    setCJK(9);
    pdf.setTextColor(60, 60, 60);
    const x = margin + (indent || 0);
    const lines = wrapText(pdf, text, cW - (indent || 0));
    for (const line of lines) {
      y = checkPage(pdf, y, 5, pageH, margin);
      pdf.text(line, x, y);
      y += 4.5;
    }
  };

  const labelText = (label) => {
    y = checkPage(pdf, y, 6, pageH, margin);
    setCJK(9);
    pdf.setTextColor(40, 40, 40);
    pdf.text(label, margin, y);
    y += 5;
  };

  // ========== Project Summary ==========
  if (reportData?.summary) {
    sectionTitle("📊 項目工作摘要");
    setCJK(9);
    pdf.setTextColor(50, 50, 50);
    pdf.text(`總參與項目：${reportData.summary.projectCount}    總工時：${reportData.summary.totalHours}h    總任務數：${reportData.summary.totalTasks}`, margin, y);
    y += 5;
    if (reportData.summary.totalSales > 0) {
      pdf.text(`總銷售額：$${reportData.summary.totalSales.toLocaleString()}`, margin, y);
      y += 5;
    }
    y += 3;

    // GP & Tender fields
    if (reportData.gpFields?.length > 0 && !reportData.gpDisabled) {
      for (const f of reportData.gpFields) {
        if (f.amount > 0) {
          pdf.text(`  ${f.label}：$${f.amount.toLocaleString()}`, margin, y);
          y += 4.5;
        }
      }
      y += 2;
    }
    if (reportData.tenderFields?.length > 0 && !reportData.tenderDisabled) {
      for (const f of reportData.tenderFields) {
        if (f.count > 0) {
          pdf.text(`  ${f.label}：${f.count}`, margin, y);
          y += 4.5;
        }
      }
      y += 2;
    }

    // Project details
    if (reportData.projects?.length > 0) {
      for (const p of reportData.projects) {
        y = checkPage(pdf, y, 10, pageH, margin);
        setCJK(9);
        pdf.setTextColor(30, 30, 30);
        let meta = `${p.hours}h · ${p.tasks} 個任務`;
        if (p.sales > 0) meta += ` · $${p.sales.toLocaleString()}`;
        if (p.avgScore) meta += ` · 綜合評分 ${p.avgScore}/5`;
        pdf.text(`▸ ${p.name}`, margin + 2, y);
        y += 4.5;
        setCJK(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`  ${meta}`, margin + 4, y);
        y += 4.5;

        // Contribution points
        const pts = parsePoints(p.points);
        if (pts.length > 0) {
          setCJK(8);
          pdf.setTextColor(70, 70, 70);
          for (const pt of pts) {
            y = checkPage(pdf, y, 5, pageH, margin);
            const lines = wrapText(pdf, `• ${pt}`, cW - 10);
            for (const line of lines) {
              y = checkPage(pdf, y, 4.5, pageH, margin);
              pdf.text(line, margin + 8, y);
              y += 4;
            }
          }
        }
        y += 2;
      }
    }
  }

  // ========== Extra Contributions ==========
  if (reportData?.extras?.length > 0) {
    sectionTitle("🌟 額外貢獻");
    for (const e of reportData.extras) {
      y = checkPage(pdf, y, 6, pageH, margin);
      setCJK(9);
      pdf.setTextColor(50, 50, 50);
      const line = e.avgScore ? `▸ ${e.description}（綜合評分 ${e.avgScore}/5）` : `▸ ${e.description}`;
      const lines = wrapText(pdf, line, cW - 4);
      for (const l of lines) {
        y = checkPage(pdf, y, 4.5, pageH, margin);
        pdf.text(l, margin + 2, y);
        y += 4.5;
      }
    }
    y += 3;
  }

  // ========== Challenges ==========
  sectionTitle("⚡ 年度遇到的困難及解決方法");
  labelText("遇到的困難：");
  bodyText(reportData?.challenges || annualReview?.challenges || "（未填寫）", 3);
  y += 2;
  labelText("需要公司協助：");
  bodyText(reportData?.challengesSolution || annualReview?.challenges_solution || "（未填寫）", 3);
  y += 3;

  // ========== Goals ==========
  sectionTitle("🎯 未來一年目標");
  labelText("目標：");
  bodyText(reportData?.goals || annualReview?.next_year_goals || "（未填寫）", 3);
  y += 2;
  labelText("為完成目標願意做的事：");
  bodyText(reportData?.commitment || annualReview?.commitment || "（未填寫）", 3);
  y += 3;

  // ========== Leader Feedback ==========
  const leaderComment = reportData?.leaderComment || annualReview?.leader_comment;
  const leaderExpectation = reportData?.leaderExpectation || annualReview?.leader_next_year_expectation;
  if (leaderComment || leaderExpectation) {
    sectionTitle("👤 Team Leader 回饋");
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
  const skills = reportData?.skillScores || annualReview?.skill_scores;
  const selfSkills = annualReview?.skill_self_scores;
  if (skills?.length > 0 && skills.some(s => s.boss_score > 0)) {
    sectionTitle("🛠️ 工作技能評分");
    setCJK(9);
    for (const s of skills) {
      if (!s.boss_score) continue;
      y = checkPage(pdf, y, 5, pageH, margin);
      const label = SKILL_LABELS[s.key] || s.key;
      const selfS = selfSkills?.find(ss => ss.key === s.key)?.self_score;
      let line = `  ${label}：`;
      if (selfS > 0) line += `自評 ${selfS}/5  `;
      line += `老闆 ${s.boss_score}/5`;
      pdf.text(line, margin, y);
      y += 5;
    }
    y += 3;
  }

  // ========== Boss Notes ==========
  const deptGoals = annualReview?.boss_dept_goals?.filter(g => g?.trim());
  const personalGoals = annualReview?.boss_personal_goals?.filter(g => g?.trim());
  const extraNotes = annualReview?.boss_extra_notes;
  if (deptGoals?.length > 0 || personalGoals?.length > 0 || extraNotes) {
    sectionTitle("📝 公司目標及補充");
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
  pdf.addPage();
  y = 30;

  setCJK(14);
  pdf.setTextColor(30, 30, 80);
  pdf.text("簽署確認", pageW / 2, y, { align: "center" });
  y += 6;
  setLatin(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text("Signatures / Confirmation", pageW / 2, y, { align: "center" });
  y += 12;

  setCJK(9);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`員工：${report.staff_name}    財政年度：${report.fiscal_year}`, margin + 5, y);
  y += 12;

  const sigW = 70;
  const sigH = 35;
  const col1X = margin + 10;
  const col2X = pageW / 2 + 10;

  // Labels
  setCJK(10);
  pdf.setTextColor(50, 50, 50);
  pdf.text("員工簽名", col1X, y);
  pdf.text("老闆簽名", col2X, y);
  y += 5;

  // Signature images
  if (staffSig) pdf.addImage(staffSig, "PNG", col1X, y, sigW, sigH);
  if (bossSig) pdf.addImage(bossSig, "PNG", col2X, y, sigW, sigH);
  y += sigH + 3;

  // Lines
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(0.3);
  pdf.line(col1X, y, col1X + sigW, y);
  pdf.line(col2X, y, col2X + sigW, y);
  y += 6;

  // Names
  setCJK(9);
  pdf.setTextColor(60, 60, 60);
  pdf.text(report.staff_name || "", col1X, y);
  pdf.text("Management", col2X, y);
  y += 8;

  // Date
  pdf.text(`日期：${today}`, col1X, y);
  pdf.text(`日期：${today}`, col2X, y);

  // Save
  pdf.save(`Appraisal_${report.staff_name}_${report.fiscal_year}.pdf`);
}