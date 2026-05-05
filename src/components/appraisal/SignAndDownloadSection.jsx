import { useState, useRef } from "react";
import { Loader2, Download, PenTool } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import SignaturePad from "./SignaturePad";

export default function SignAndDownloadSection({ report, contentRef }) {
  const [showSignature, setShowSignature] = useState(false);
  const [staffSig, setStaffSig] = useState(null);
  const [bossSig, setBossSig] = useState(null);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit" });

  const handleGenerate = async () => {
    if (!staffSig || !bossSig) {
      alert("請先完成員工及老闆簽名");
      return;
    }
    setGenerating(true);
    try {
      // 1. Capture the report content as image via html2canvas
      const el = contentRef.current;
      if (!el) { alert("找不到報告內容"); setGenerating(false); return; }

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const imgW = canvas.width;
      const imgH = canvas.height;

      // 2. Build PDF (A4)
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const contentW = pageW - margin * 2;

      // Scale content image to fit page width
      const ratio = contentW / imgW;
      const scaledH = imgH * ratio;

      // Split into pages
      const pageContentH = pageH - margin * 2;
      let srcY = 0;
      let page = 0;

      while (srcY < imgH) {
        if (page > 0) pdf.addPage();
        const sliceH = Math.min(pageContentH / ratio, imgH - srcY);

        // Create a temporary canvas for this slice
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgW;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, srcY, imgW, sliceH, 0, 0, imgW, sliceH);

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const slicePageH = sliceH * ratio;
        pdf.addImage(sliceData, "JPEG", margin, margin, contentW, slicePageH);

        srcY += sliceH;
        page++;
      }

      // 3. Add signature page
      pdf.addPage();
      let y = 25;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 30, 80);
      pdf.text("Signatures / Confirmation", pageW / 2, y, { align: "center" });
      y += 15;

      // Staff info line
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Staff: ${report.staff_name}    Fiscal Year: ${report.fiscal_year}`, margin + 5, y);
      y += 12;

      const sigW = 70;
      const sigH = 35;
      const sigGap = 30;
      const col1X = margin + 15;
      const col2X = pageW / 2 + 15;

      // Staff signature
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(50, 50, 50);
      pdf.text("Employee", col1X, y);
      pdf.text("Management", col2X, y);
      y += 5;

      // Draw signature images
      pdf.addImage(staffSig, "PNG", col1X, y, sigW, sigH);
      pdf.addImage(bossSig, "PNG", col2X, y, sigW, sigH);
      y += sigH + 3;

      // Signature lines
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);
      pdf.line(col1X, y, col1X + sigW, y);
      pdf.line(col2X, y, col2X + sigW, y);
      y += 6;

      // Names
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(report.staff_name || "", col1X, y);
      pdf.text("Boss", col2X, y);
      y += 8;

      // Date — auto filled
      pdf.setFontSize(9);
      pdf.text(`Date: ${today}`, col1X, y);
      pdf.text(`Date: ${today}`, col2X, y);

      // 4. Download
      pdf.save(`Appraisal_${report.staff_name}_${report.fiscal_year}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF 生成失敗：" + (err.message || "未知錯誤"));
    }
    setGenerating(false);
  };

  if (!showSignature) {
    return (
      <div className="flex justify-center pt-2 pb-4">
        <button
          onClick={() => setShowSignature(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          <PenTool size={16} />
          簽名並下載 PDF
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-md p-5 space-y-5">
      <div className="text-center">
        <h3 className="text-base font-bold text-indigo-800">✍️ 電子簽名</h3>
        <p className="text-xs text-gray-500 mt-1">請員工及老闆分別在下方簽名，完成後生成 PDF</p>
        <p className="text-xs text-gray-400 mt-0.5">日期：{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SignaturePad label="👤 員工簽名" onSignatureChange={setStaffSig} />
        <SignaturePad label="👔 老闆簽名" onSignatureChange={setBossSig} />
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => setShowSignature(false)}
          className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating || !staffSig || !bossSig}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {generating ? "PDF 生成中..." : "生成並下載 PDF"}
        </button>
      </div>
    </div>
  );
}