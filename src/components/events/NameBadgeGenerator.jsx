import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Download, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BADGE_PRESETS = [
  { label: "標準 (105×74mm)", width: 105, height: 74, cols: 2 },
  { label: "大型 (148×105mm)", width: 148, height: 105, cols: 1 },
  { label: "小型 (90×54mm)", width: 90, height: 54, cols: 2 },
  { label: "自訂", width: 0, height: 0, cols: 0 },
];

const BADGE_STYLES = [
  { id: "geo-blue", label: "幾何藍", bg: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #bfdbfe 100%)", border: "2px solid #3b82f6", pattern: "repeating-linear-gradient(60deg, transparent, transparent 20px, rgba(59,130,246,0.06) 20px, rgba(59,130,246,0.06) 21px), repeating-linear-gradient(-60deg, transparent, transparent 20px, rgba(59,130,246,0.06) 20px, rgba(59,130,246,0.06) 21px)", patternSize: "" },
  { id: "wave-teal", label: "波浪綠", bg: "#f0fdfa", border: "2px solid #14b8a6", pattern: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.08) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(20,184,166,0.1) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 14px, rgba(20,184,166,0.05) 14px, rgba(20,184,166,0.05) 15px)", patternSize: "" },
  { id: "diamond-gold", label: "菱格金", bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "2px solid #d97706", pattern: "repeating-conic-gradient(rgba(217,119,6,0.04) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px", patternSize: "16px 16px" },
  { id: "dots-coral", label: "圓點珊瑚", bg: "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)", border: "2px solid #f43f5e", pattern: "radial-gradient(circle, rgba(244,63,94,0.1) 1.5px, transparent 1.5px)", patternSize: "14px 14px" },
  { id: "stripe-purple", label: "條紋紫", bg: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", border: "2px solid #a855f7", pattern: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(168,85,247,0.05) 10px, rgba(168,85,247,0.05) 12px)", patternSize: "" },
  { id: "elegant-dark", label: "尊貴深色", bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "2px solid #475569", pattern: "repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(148,163,184,0.05) 20px, rgba(148,163,184,0.05) 21px), repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(148,163,184,0.05) 20px, rgba(148,163,184,0.05) 21px)", patternSize: "", textColor: "#f1f5f9" },
  { id: "crosshatch", label: "網格經典", bg: "#ffffff", border: "2px solid #6b7280", pattern: "repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(107,114,128,0.06) 18px, rgba(107,114,128,0.06) 19px), repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(107,114,128,0.06) 18px, rgba(107,114,128,0.06) 19px)", patternSize: "" },
  { id: "custom", label: "自訂背景圖", bg: "#ffffff", border: "2px dashed #94a3b8", pattern: "" },
];

const DISPLAY_FIELDS = [
  { key: "name", label: "姓名", default: true },
  { key: "department", label: "部門", default: true },
  { key: "position", label: "職位", default: true },
  { key: "seat", label: "座位資訊", default: true },
  { key: "email", label: "電郵", default: false },
  { key: "phone", label: "電話", default: false },
  { key: "company", label: "公司", default: false },
  { key: "companion_label", label: "同行者標籤", default: true },
];

export default function NameBadgeGenerator({ eventId }) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [seating, setSeating] = useState({});
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badgePreset, setBadgePreset] = useState(0);
  const [customWidth, setCustomWidth] = useState(105);
  const [customHeight, setCustomHeight] = useState(74);
  const [customCols, setCustomCols] = useState(2);
  const [badgeStyle, setBadgeStyle] = useState("geo-blue");
  const [customBgUrl, setCustomBgUrl] = useState("");
  const [uploadingBg, setUploadingBg] = useState(false);
  const [selectedFields, setSelectedFields] = useState(
    DISPLAY_FIELDS.filter((f) => f.default).map((f) => f.key)
  );
  const [formFieldsToShow, setFormFieldsToShow] = useState([]);
  const printRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchForms();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("*, event_sections(name)")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .order("registered_at");

    const { data: seats } = await supabase
      .from("seating_arrangements")
      .select("*")
      .eq("event_id", eventId);

    if (regs) setRegistrations(regs);
    if (seats) {
      const map = {};
      seats.forEach((s) => {
        const seatKey = `${s.registration_id}__${s.guest_index || 0}`;
        map[seatKey] = s;
      });
      setSeating(map);
    }
    setLoading(false);
  };

  const fetchForms = async () => {
    const { data } = await supabase
      .from("registration_forms")
      .select("id, fields_config")
      .eq("event_id", eventId);
    if (data) setForms(data);
  };

  // Collect all unique form fields from forms
  const allFormFields = (() => {
    const seen = new Set();
    const fields = [];
    forms.forEach((form) => {
      (form.fields_config || []).forEach((f) => {
        if (!seen.has(f.key)) {
          seen.add(f.key);
          fields.push({ key: f.key, label: f.label || f.key });
        }
      });
    });
    return fields;
  })();

  const getFieldValue = (reg, fieldKey) => {
    if (!reg) return "";
    const fd = reg.form_data || {};
    switch (fieldKey) {
      case "name": return fd.name || fd.姓名 || "未填姓名";
      case "department": return fd.department || fd.部門 || "";
      case "position": return fd.position || fd.職位 || "";
      case "email": return fd.email || fd.電郵 || "";
      case "phone": return fd.phone || fd.電話 || "";
      case "company": return fd.company || fd.公司 || "";
      default: return fd[fieldKey] || "";
    }
  };

  // Build badge entries: registrant + their companions
  const badgeEntries = (() => {
    const seen = new Set();
    const entries = [];
    registrations.forEach((reg) => {
      const email = (reg.form_data?.email || reg.form_data?.電郵 || "").toLowerCase();
      const personKey = email || `id:${reg.id}`;
      if (seen.has(personKey)) return;
      seen.add(personKey);

      const regName = getFieldValue(reg, "name");
      const seat = seating[`${reg.id}__0`];
      const guestCount = reg.guest_count || 0;
      const guestNames = reg.guest_names || [];

      entries.push({
        id: reg.id,
        reg,
        name: regName,
        seat,
        isCompanion: false,
        companionOf: null,
      });

      for (let i = 0; i < guestCount; i++) {
        const companionSeatKey = `${reg.id}__${i + 1}`;
        entries.push({
          id: companionSeatKey,
          reg,
          name: guestNames[i] || `同行者 ${i + 1}`,
          seat: seating[companionSeatKey],
          isCompanion: true,
          companionOf: regName,
        });
      }
    });
    return entries;
  })();

  const currentPreset = BADGE_PRESETS[badgePreset];
  const badgeWidth = badgePreset === 3 ? customWidth : currentPreset.width;
  const badgeHeight = badgePreset === 3 ? customHeight : currentPreset.height;
  const cols = badgePreset === 3 ? customCols : currentPreset.cols;
  const currentStyle = BADGE_STYLES.find((s) => s.id === badgeStyle) || BADGE_STYLES[0];

  const handleUploadBg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `badge-bg-${eventId}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("event-covers").upload(fileName, file, { upsert: true });
    if (error) {
      toast({ title: "上傳失敗", description: error.message, variant: "destructive" });
      setUploadingBg(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("event-covers").getPublicUrl(fileName);
    setCustomBgUrl(urlData.publicUrl);
    setBadgeStyle("custom");
    setUploadingBg(false);
    toast({ title: "背景圖已上傳" });
  };

  const getBadgeBackground = () => {
    if (badgeStyle === "custom" && customBgUrl) {
      return { background: `url(${customBgUrl}) center/cover no-repeat`, border: "1px solid #e2e8f0" };
    }
    const style = { border: currentStyle.border };
    if (currentStyle.pattern) {
      style.background = `${currentStyle.pattern}, ${currentStyle.bg}`;
      if (currentStyle.patternSize) style.backgroundSize = currentStyle.patternSize;
    } else {
      style.background = currentStyle.bg;
    }
    return style;
  };

  const exportExcel = () => {
    if (badgeEntries.length === 0) {
      toast({ title: "無名牌資料可匯出", variant: "destructive" });
      return;
    }
    const activeFields = selectedFields.filter(k => k !== "name" && k !== "seat" && k !== "companion_label");
    const headers = ["姓名", ...activeFields.map(k => DISPLAY_FIELDS.find(f=>f.key===k)?.label || k), ...formFieldsToShow.map(k => allFormFields.find(f=>f.key===k)?.label || k), "桌號", "座位號", "身份", "所屬報名人"];
    const rows = badgeEntries.map((entry) => [
      entry.name,
      ...activeFields.map(k => getFieldValue(entry.reg, k)),
      ...formFieldsToShow.map(k => getFieldValue(entry.reg, k)),
      entry.seat?.table_number || "",
      entry.seat?.seat_number || "",
      entry.isCompanion ? "同行人" : "報名人",
      entry.isCompanion ? entry.companionOf : "",
    ]);
    const tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>td,th{mso-number-format:"\\@";}</style></head><body><table border="1"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const blob = new Blob(["\uFEFF" + tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `name_badges_${eventId}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已匯出 Excel" });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "無法開啟列印視窗，請允許彈出視窗", variant: "destructive" });
      return;
    }
    const bgStyle = getBadgeBackground();
    const bgCSS = Object.entries(bgStyle).map(([k, v]) => `${k}: ${v};`).join(" ");
    const textColor = currentStyle.textColor || "#1e293b";

    const badgesHTML = badgeEntries.map((entry) => {
      const seatInfo = entry.seat?.table_number
        ? `桌 ${entry.seat.table_number}${entry.seat.seat_number ? ` · 座 ${entry.seat.seat_number}` : ""}`
        : "";
      const companionLabel = (entry.isCompanion && selectedFields.includes("companion_label"))
        ? `<div class="companion">${entry.companionOf} 的同行人</div>` : "";
      let fieldsHTML = "";
      selectedFields.forEach((key) => {
        if (key === "name" || key === "seat" || key === "companion_label") return;
        const val = getFieldValue(entry.reg, key);
        const fieldLabel = DISPLAY_FIELDS.find(f => f.key === key)?.label || key;
        if (val) fieldsHTML += `<div class="field"><span class="field-label">${fieldLabel}:</span> ${val}</div>`;
      });
      formFieldsToShow.forEach((key) => {
        const val = getFieldValue(entry.reg, key);
        const fieldLabel = allFormFields.find(f => f.key === key)?.label || key;
        if (val) fieldsHTML += `<div class="field"><span class="field-label">${fieldLabel}:</span> ${val}</div>`;
      });
      return `<div class="badge">${companionLabel}<div class="name">${entry.name}</div>${fieldsHTML}${(selectedFields.includes("seat") && seatInfo) ? `<div class="table-info">${seatInfo}</div>` : ""}</div>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>名牌列印</title><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
.badge-grid { display: grid; grid-template-columns: repeat(${cols}, ${badgeWidth}mm); gap: 0; width: ${cols * badgeWidth}mm; margin: 0 auto; }
.badge { width: ${badgeWidth}mm; height: ${badgeHeight}mm; ${bgCSS} color: ${textColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8mm; page-break-inside: avoid; position: relative; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.badge .name { font-size: 22pt; font-weight: bold; margin-bottom: 3mm; text-align: center; }
.badge .field { font-size: 11pt; opacity: 0.8; margin-bottom: 1.5mm; }
.badge .field .field-label { font-weight: 600; opacity: 0.7; }
.badge .table-info { font-size: 10pt; opacity: 0.6; margin-top: 3mm; }
.badge .companion { font-size: 9pt; color: #7c3aed; background: #f3e8ff; padding: 1mm 3mm; border-radius: 2mm; margin-bottom: 2mm; }
@media print { body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; } .badge-grid { width: 100%; margin: 0; } .badge { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
@page { size: A4; margin: 5mm; }
</style></head><body><div class="badge-grid">${badgesHTML}</div></body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
    setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch (e) {} }, 800);
  };

  const toggleField = (key) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleFormField = (key) => {
    setFormFieldsToShow((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">🏷️ 名牌印刷</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={badgeEntries.length === 0}>
            <Download className="w-4 h-4 mr-1" />
            匯出 Excel
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={badgeEntries.length === 0}>
            <Printer className="w-4 h-4 mr-1" />
            列印名牌
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">載入中...</p>
        ) : badgeEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暫無報名記錄</p>
        ) : (
          <>
            {/* Settings area */}
            <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
              {/* Badge size */}
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <Label className="text-xs">名牌尺寸</Label>
                  <Select value={String(badgePreset)} onValueChange={(v) => setBadgePreset(parseInt(v))}>
                    <SelectTrigger className="w-[180px] h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BADGE_PRESETS.map((p, i) => (<SelectItem key={i} value={String(i)}>{p.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {badgePreset === 3 && (
                  <>
                    <div>
                      <Label className="text-xs">寬度 (mm)</Label>
                      <Input type="number" className="w-20 h-8" value={customWidth} onChange={(e) => setCustomWidth(Math.max(40, parseInt(e.target.value) || 40))} />
                    </div>
                    <div>
                      <Label className="text-xs">高度 (mm)</Label>
                      <Input type="number" className="w-20 h-8" value={customHeight} onChange={(e) => setCustomHeight(Math.max(30, parseInt(e.target.value) || 30))} />
                    </div>
                    <div>
                      <Label className="text-xs">每行數量</Label>
                      <Input type="number" className="w-16 h-8" value={customCols} onChange={(e) => setCustomCols(Math.max(1, parseInt(e.target.value) || 1))} />
                    </div>
                  </>
                )}
              </div>

              {/* Badge style */}
              <div>
                <Label className="text-xs mb-2 block">名牌樣式</Label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setBadgeStyle(style.id)}
                      className={`px-4 py-3 text-xs rounded-lg border-2 transition-all min-w-[80px] ${
                        badgeStyle === style.id ? "border-blue-500 ring-2 ring-blue-200 scale-105" : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ background: style.pattern ? `${style.pattern}, ${style.bg}` : style.bg, color: style.textColor || "#1e293b", backgroundSize: style.patternSize || "auto" }}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
                {badgeStyle === "custom" && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingBg}>
                      <Upload className="w-4 h-4 mr-1" />
                      {uploadingBg ? "上傳中..." : "上傳背景圖"}
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadBg} />
                    {customBgUrl && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">已上傳</span>
                        <img src={customBgUrl} className="w-12 h-8 object-cover rounded border" alt="bg" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field selection */}
              <div>
                <Label className="text-xs mb-2 block">顯示欄位</Label>
                <div className="flex flex-wrap gap-3">
                  {DISPLAY_FIELDS.map((field) => (
                    <label key={field.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox checked={selectedFields.includes(field.key)} onCheckedChange={() => toggleField(field.key)} />
                      {field.label}
                    </label>
                  ))}
                </div>
                {allFormFields.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-xs mb-1 block text-muted-foreground">表單欄位</Label>
                    <div className="flex flex-wrap gap-3">
                      {allFormFields.filter((f) => !DISPLAY_FIELDS.some((d) => d.key === f.key)).map((field) => (
                        <label key={field.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox checked={formFieldsToShow.includes(field.key)} onCheckedChange={() => toggleFormField(field.key)} />
                          {field.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              預覽 {badgeEntries.length} 個名牌（{badgeWidth}×{badgeHeight}mm，每行 {cols} 個）
            </p>

            {/* Preview */}
            <div ref={printRef} className="border rounded-lg p-4 bg-white overflow-auto max-h-[500px]">
              <div className="gap-0 mx-auto" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {badgeEntries.map((entry) => {
                  const bgStyle = getBadgeBackground();
                  const textColor = currentStyle.textColor || "#1e293b";
                  return (
                    <div
                      key={entry.id}
                      className="p-4 flex flex-col items-center justify-center"
                      style={{ minHeight: `${Math.max(120, badgeHeight * 2.2)}px`, ...bgStyle, color: textColor }}
                    >
                      {entry.isCompanion && selectedFields.includes("companion_label") && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded mb-1">
                          {entry.companionOf} 的同行人
                        </span>
                      )}
                      {selectedFields.includes("name") && (
                        <p className="text-lg font-bold text-center">{entry.name}</p>
                      )}
                      {selectedFields.filter(k => k !== "name" && k !== "seat" && k !== "companion_label").map((key) => {
                        const val = getFieldValue(entry.reg, key);
                        if (!val) return null;
                        const fieldLabel = DISPLAY_FIELDS.find(f => f.key === key)?.label || key;
                        return <p key={key} className="text-sm opacity-80 mt-0.5"><span className="font-semibold opacity-70">{fieldLabel}:</span> {val}</p>;
                      })}
                      {formFieldsToShow.map((key) => {
                        const val = getFieldValue(entry.reg, key);
                        if (!val) return null;
                        const fieldLabel = allFormFields.find(f => f.key === key)?.label || key;
                        return <p key={key} className="text-xs opacity-70 mt-0.5"><span className="font-semibold opacity-70">{fieldLabel}:</span> {val}</p>;
                      })}
                      {selectedFields.includes("seat") && entry.seat?.table_number && (
                        <p className="text-xs opacity-60 mt-2">
                          桌 {entry.seat.table_number}{entry.seat.seat_number ? ` · 座 ${entry.seat.seat_number}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
