import { useState } from "react";
import { Loader2, Download, PenTool } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignaturePad from "./SignaturePad";

export default function SignAndDownloadSection({ report, onPdfSaved }) {
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
      const response = await base44.functions.invoke('generateAppraisalPdf', {
        report_id: report.id,
        staff_signature: staffSig,
        boss_signature: bossSig,
      });

      const { file_url, file_name } = response.data;
      
      await base44.entities.AppraisalReport.update(report.id, { pdf_url: file_url });
      // Mark annual review as completed
      if (report.annual_review_id) {
        await base44.entities.AnnualReview.update(report.annual_review_id, { status: "completed" });
      }
      if (onPdfSaved) onPdfSaved(file_url);

      const a = document.createElement("a");
      a.href = file_url;
      a.download = file_name || `Appraisal_${report.staff_name}_${report.fiscal_year}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF 生成失敗：" + (err.message || "未知錯誤"));
    }
    setGenerating(false);
  };

  // If PDF already exists, don't show the sign/download button
  if (report.pdf_url) {
    return null;
  }

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
          {generating ? "PDF 生成中（首次需載入字體）..." : "生成並下載 PDF"}
        </button>
      </div>
    </div>
  );
}