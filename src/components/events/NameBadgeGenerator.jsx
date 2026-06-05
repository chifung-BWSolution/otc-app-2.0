import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BADGE_PRESETS = [
  { label: "標準 (105×74mm)", width: 105, height: 74, cols: 2 },
  { label: "大型 (148×105mm)", width: 148, height: 105, cols: 1 },
  { label: "小型 (90×54mm)", width: 90, height: 54, cols: 2 },
  { label: "自訂", width: 0, height: 0, cols: 0 },
];

export default function NameBadgeGenerator({ eventId }) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [seating, setSeating] = useState({});
  const [loading, setLoading] = useState(true);
  const [badgePreset, setBadgePreset] = useState(0);
  const [customWidth, setCustomWidth] = useState(105);
  const [customHeight, setCustomHeight] = useState(74);
  const [customCols, setCustomCols] = useState(2);
  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
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

  // Build badge entries: registrant + their companions
  const badgeEntries = (() => {
    const seen = new Set();
    const entries = [];
    registrations.forEach((reg) => {
      const email = (reg.form_data?.email || reg.form_data?.電郵 || "").toLowerCase();
      const personKey = email || `id:${reg.id}`;
      if (seen.has(personKey)) return;
      seen.add(personKey);

      const regName = reg.form_data?.name || reg.form_data?.姓名 || "未填姓名";
      const department = reg.form_data?.department || reg.form_data?.部門 || "";
      const position = reg.form_data?.position || reg.form_data?.職位 || "";
      const seat = seating[`${reg.id}__0`];
      const guestCount = reg.guest_count || 0;
      const guestNames = reg.guest_names || [];

      // Main registrant badge
      entries.push({
        id: reg.id,
        name: regName,
        department,
        position,
        seat,
        isCompanion: false,
        companionOf: null,
      });

      // Companion badges
      for (let i = 0; i < guestCount; i++) {
        const companionSeatKey = `${reg.id}__${i + 1}`;
        entries.push({
          id: companionSeatKey,
          name: guestNames[i] || `同行者 ${i + 1}`,
          department: "",
          position: "",
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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "無法開啟列印視窗，請允許彈出視窗", variant: "destructive" });
      return;
    }

    const badgesHTML = badgeEntries.map((entry) => {
      const seatInfo = entry.seat?.table_number
        ? `桌 ${entry.seat.table_number}${entry.seat.seat_number ? ` · 座 ${entry.seat.seat_number}` : ""}`
        : "";
      const companionLabel = entry.isCompanion ? `<div class="companion">${entry.companionOf} 的同行人</div>` : "";
      return `
        <div class="badge">
          ${companionLabel}
          <div class="name">${entry.name}</div>
          ${entry.department ? `<div class="dept">${entry.department}</div>` : ""}
          ${entry.position ? `<div class="position">${entry.position}</div>` : ""}
          ${seatInfo ? `<div class="table-info">${seatInfo}</div>` : ""}
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>名牌列印</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif; }
            .badge-grid {
              display: grid;
              grid-template-columns: repeat(${cols}, ${badgeWidth}mm);
              gap: 0;
              width: ${cols * badgeWidth}mm;
              margin: 0 auto;
            }
            .badge {
              width: ${badgeWidth}mm;
              height: ${badgeHeight}mm;
              border: 1px dashed #ccc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 8mm;
              page-break-inside: avoid;
              position: relative;
            }
            .badge .name {
              font-size: 22pt;
              font-weight: bold;
              margin-bottom: 3mm;
              text-align: center;
            }
            .badge .dept {
              font-size: 11pt;
              color: #444;
              margin-bottom: 1.5mm;
            }
            .badge .position {
              font-size: 10pt;
              color: #666;
              margin-bottom: 1.5mm;
            }
            .badge .table-info {
              font-size: 10pt;
              color: #888;
              margin-top: 3mm;
            }
            .badge .companion {
              font-size: 9pt;
              color: #7c3aed;
              background: #f3e8ff;
              padding: 1mm 3mm;
              border-radius: 2mm;
              margin-bottom: 2mm;
            }
            @media print {
              body { margin: 0; }
              .badge-grid { width: 100%; margin: 0; }
              .badge { border: 1px dashed #ddd; }
            }
            @page {
              size: A4;
              margin: 5mm;
            }
          </style>
        </head>
        <body>
          <div class="badge-grid">
            ${badgesHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for content to render before triggering print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    // Fallback if onload doesn't fire (some browsers)
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        // ignore if already printed
      }
    }, 800);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">🏷️ 名牌印刷</CardTitle>
        <Button size="sm" onClick={handlePrint} disabled={badgeEntries.length === 0}>
          <Printer className="w-4 h-4 mr-1" />
          列印名牌
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">載入中...</p>
        ) : badgeEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暫無報名記錄</p>
        ) : (
          <>
            {/* Badge size settings */}
            <div className="flex flex-wrap gap-4 items-end mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs">名牌尺寸</Label>
                <Select
                  value={String(badgePreset)}
                  onValueChange={(v) => setBadgePreset(parseInt(v))}
                >
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_PRESETS.map((p, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {badgePreset === 3 && (
                <>
                  <div>
                    <Label className="text-xs">寬度 (mm)</Label>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Math.max(40, parseInt(e.target.value) || 40))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">高度 (mm)</Label>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Math.max(30, parseInt(e.target.value) || 30))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">每行數量</Label>
                    <Input
                      type="number"
                      className="w-16 h-8"
                      value={customCols}
                      onChange={(e) => setCustomCols(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              預覽 {badgeEntries.length} 個名牌（{badgeWidth}×{badgeHeight}mm，每行 {cols} 個）
            </p>

            {/* Preview */}
            <div
              ref={printRef}
              className="border rounded-lg p-4 bg-white overflow-auto max-h-[500px]"
            >
              <div
                className="gap-0 mx-auto"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                }}
              >
                {badgeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center"
                    style={{ minHeight: `${Math.max(120, badgeHeight * 2.2)}px` }}
                  >
                    {entry.isCompanion && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded mb-1">
                        {entry.companionOf} 的同行人
                      </span>
                    )}
                    <p className="text-lg font-bold text-center">
                      {entry.name}
                    </p>
                    {entry.department && (
                      <p className="text-sm text-gray-600 mt-1">
                        {entry.department}
                      </p>
                    )}
                    {entry.position && (
                      <p className="text-xs text-gray-500">{entry.position}</p>
                    )}
                    {entry.seat?.table_number && (
                      <p className="text-xs text-gray-400 mt-2">
                        桌 {entry.seat.table_number}
                        {entry.seat.seat_number ? ` · 座 ${entry.seat.seat_number}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
