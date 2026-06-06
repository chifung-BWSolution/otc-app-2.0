import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, Trash2, Upload, FileDown, UserCheck, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const REG_STATUS_OPTIONS = [
  { value: "pending", label: "待處理", color: "bg-gray-100 text-gray-700" },
  { value: "rsvp_sent", label: "已傳送RSVP", color: "bg-blue-100 text-blue-700" },
  { value: "awaiting_confirm", label: "待確認", color: "bg-yellow-100 text-yellow-700" },
  { value: "attending", label: "會出席", color: "bg-green-100 text-green-700" },
  { value: "not_attending", label: "不會出席", color: "bg-red-100 text-red-700" },
];

// Staff picker popover component
function StaffPicker({ staffList, currentValue, staffMap, onSelect }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = staffList.filter((s) => {
    const name = s.chinese_name || s.display_name || s.full_name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.work_email || "").toLowerCase().includes(searchTerm.toLowerCase());
  });
  const currentName = currentValue ? (staffMap[String(currentValue).trim()] || currentValue) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
          <UserCheck className="w-3.5 h-3.5" />
          {currentName || <span className="text-muted-foreground">指定跟進人</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder="搜尋員工..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 text-xs mb-2"
        />
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {currentValue && (
            <button
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600"
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              清除跟進人
            </button>
          )}
          {filtered.slice(0, 30).map((s) => {
            const name = s.chinese_name || s.display_name || s.full_name || s.id;
            const id = s.bubble_id || s.id;
            return (
              <button
                key={s.id}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex justify-between items-center"
                onClick={() => { onSelect(id); setOpen(false); }}
              >
                <span>{name}</span>
                {s.work_email && <span className="text-muted-foreground truncate ml-2 max-w-[100px]">{s.work_email}</span>}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">找不到員工</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function RegistrationList({ eventId }) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [sections, setSections] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addFormData, setAddFormData] = useState({});
  const [addMeta, setAddMeta] = useState({ guest_count: "0", guest_names: "", section_ids: [] });
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    fetchStaffMap();
    fetchSections();
    fetchForms();
  }, [eventId]);

  const fetchSections = async () => {
    const { data } = await supabase
      .from("event_sections")
      .select("id, name, sort_order")
      .eq("event_id", eventId)
      .order("sort_order");
    if (data) setSections(data);
  };

  const fetchForms = async () => {
    const { data } = await supabase
      .from("registration_forms")
      .select("id, title, fields_config, max_guests_per_registration")
      .eq("event_id", eventId)
      .order("created_at");
    if (data) setForms(data);
  };

  // Get section number label (index-based)
  const getSectionLabel = (sectionName, sectionId) => {
    if (!sectionId && !sectionName) return "-";
    const idx = sections.findIndex((s) => s.id === sectionId || s.name === sectionName);
    if (idx >= 0) return `#${idx + 1}`;
    return sectionName || "-";
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_registrations")
      .select("*, event_sections(name)")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });
    if (data) setRegistrations(data);
    setLoading(false);
  };

  const fetchStaffMap = async () => {
    const map = {};
    let allStaff = [];

    // 1) Try staff table directly (may be limited by RLS)
    const { data, error: staffErr } = await supabase
      .from("staff")
      .select("id, bubble_id, chinese_name, display_name, full_name, work_email, o_status");
    if (staffErr) {
      console.warn("[RegistrationList] staff table query failed:", staffErr.message);
    }
    if (data) {
      // Include all staff in map (for display), but only active staff in picker list
      data.forEach((s) => {
        const name = s.chinese_name || s.display_name || s.full_name || s.id;
        if (s.id) {
          map[String(s.id).trim()] = name;
        }
        if (s.bubble_id) {
          const bid = String(s.bubble_id).trim();
          map[bid] = name;
        }
        if (s.work_email) map[s.work_email.toLowerCase().trim()] = name;
      });
      // Only show active staff in the picker
      allStaff = data.filter((s) => !s.o_status || s.o_status === "Active");
    }

    // 2) Also fetch from publicStaffList edge function (bypasses RLS, uses bubble_id as id)
    try {
      const res = await supabase.functions.invoke("publicStaffList");
      let sList = [];
      if (res.data) {
        let parsed = res.data;
        if (typeof parsed === "string") {
          try { parsed = JSON.parse(parsed); } catch (_) { /* ignore */ }
        }
        if (Array.isArray(parsed)) {
          sList = parsed;
        } else if (parsed?.data && Array.isArray(parsed.data)) {
          sList = parsed.data;
        }
      }
      console.log("[RegistrationList] publicStaffList loaded:", sList.length, "staff");
      sList.forEach((s) => {
        const name = s.name_zh || s.name_en || s.id;
        if (s.id) {
          const sid = String(s.id).trim();
          map[sid] = name;
        }
      });
    } catch (e) {
      console.warn("publicStaffList fallback failed:", e);
    }

    console.log("[RegistrationList] staffMap sample keys:", Object.keys(map).slice(0, 5));
    setStaffMap(map);
    if (allStaff.length > 0) setStaffList(allStaff);
  };

  const deleteGroupRegistrations = async (ids) => {
    if (!confirm(`確定刪除此人的 ${ids.length} 筆報名記錄？`)) return;
    for (const id of ids) {
      await supabase.from("event_registrations").delete().eq("id", id);
    }
    fetchRegistrations();
    toast({ title: "記錄已刪除" });
  };

  const updateGroupStatus = async (ids, newStatus) => {
    for (const id of ids) {
      await supabase
        .from("event_registrations")
        .update({ registration_status: newStatus })
        .eq("id", id);
    }
    setRegistrations((prev) =>
      prev.map((r) =>
        ids.includes(r.id) ? { ...r, registration_status: newStatus } : r
      )
    );
    toast({ title: "狀態已更新" });
  };

  const updateFollowedBy = async (ids, staffId) => {
    for (const id of ids) {
      await supabase
        .from("event_registrations")
        .update({ followed_by: staffId })
        .eq("id", id);
    }
    setRegistrations((prev) =>
      prev.map((r) =>
        ids.includes(r.id) ? { ...r, followed_by: staffId } : r
      )
    );
    toast({ title: staffId ? "已指定跟進人" : "已清除跟進人" });
  };

  const exportCSV = () => {
    if (registrations.length === 0) return;
    const allKeys = new Set();
    registrations.forEach((r) => {
      if (r.form_data) Object.keys(r.form_data).forEach((k) => allKeys.add(k));
    });
    const keys = Array.from(allKeys);
    const header = ["姓名", "電郵", "同行人數", "同行人姓名", "場次", "報名狀態", "報名時間", "邀請人", ...keys];

    // Export by grouped person (one row per person)
    const rows = grouped.map((group) => {
      const first = group.registrations[0];
      const guestCount = first.guest_count || 0;
      const guestNamesList = first.guest_names || [];
      const sectionNames = group.registrations
        .map((r) => r.event_sections?.name)
        .filter(Boolean);
      return [
        first.form_data?.name || first.form_data?.姓名 || "",
        first.form_data?.email || first.form_data?.電郵 || "",
        String(guestCount),
        guestNamesList.join("、"),
        sectionNames.join("、") || "-",
        REG_STATUS_OPTIONS.find((s) => s.value === first.registration_status)?.label || first.registration_status || "待處理",
        first.registered_at ? new Date(first.registered_at).toLocaleString("zh-HK") : "",
        (() => { const _id = first.invited_by_staff_id ? String(first.invited_by_staff_id).trim() : ""; return staffMap[_id] || staffMap[_id.toLowerCase()] || ""; })(),
        ...keys.map((k) => {
          const val = first.form_data?.[k] || "";
          // Escape commas
          return String(val).includes(",") ? `"${val}"` : val;
        }),
      ];
    });
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations_${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已匯出 CSV" });
  };

  const downloadTemplate = () => {
    // Use actual form fields_config to generate template
    const allFields = [];
    const formFieldsSeen = new Set();

    forms.forEach((form) => {
      const fields = form.fields_config || [];
      fields.forEach((f) => {
        if (!formFieldsSeen.has(f.key)) {
          formFieldsSeen.add(f.key);
          allFields.push(f);
        }
      });
    });

    // If no forms found, use a basic fallback
    if (allFields.length === 0) {
      allFields.push(
        { key: "name", label: "姓名", required: true },
        { key: "email", label: "電郵", required: false }
      );
    }

    // Check if any form allows guests
    const maxGuests = Math.max(0, ...forms.map((f) => f.max_guests_per_registration || 0));

    // Build header from field labels + meta columns
    const header = allFields.map((f) => f.label || f.key);
    // Add section column if there are sections
    if (sections.length > 0) {
      header.push("場次");
    }
    if (maxGuests > 0) {
      header.push("同行人數", "同行人姓名");
    }

    // Build example row
    const exampleRow = allFields.map((f) => {
      if (f.key === "name" || f.key === "姓名") return "張三";
      if (f.key === "email" || f.key === "電郵") return "zhangsan@example.com";
      if (f.key === "phone" || f.key === "電話") return "0912345678";
      if (f.type === "select" && f.options?.length > 0) return f.options[0];
      if (f.type === "number") return "1";
      return "";
    });
    if (sections.length > 0) {
      exampleRow.push(sections[0]?.name || "");
    }
    if (maxGuests > 0) {
      exampleRow.push("2", "李四、王五");
    }

    // Build notes
    const requiredFields = allFields.filter((f) => f.required).map((f) => f.label || f.key);
    const notes = [
      "",
      "【匯入說明】",
      `• 必填欄位：${requiredFields.join("、") || "無"}`,
      "• 同行人姓名：多位可用「、」或「,」或「，」分隔",
      ...(sections.length > 0 ? [`• 場次：填入場次名稱，多場次可用「、」或「,」分隔（可用值：${sections.map(s => s.name).join("、")}）`] : []),
      "• 其他欄位可留空",
      "• 第一行為表頭，請勿修改欄位名稱",
    ];

    const csv = [header.join(","), exampleRow.join(","), "", ...notes].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registration_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已下載匯入範本" });
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    // Parse CSV into lines, preserving quoted fields (which may contain commas/newlines)
    // Each resulting "line" keeps quotes intact so parseCSVLine can handle them
    const parseCSVLines = (csvText) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < csvText.length && csvText[i + 1] === '"') {
              // Escaped quote - keep both quotes in the raw line
              current += '""';
              i++;
            } else {
              inQuotes = false;
              current += '"'; // keep closing quote
            }
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
            current += '"'; // keep opening quote
          } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n') {
              i++; // skip \r\n
            }
            const trimmed = current.trim();
            if (trimmed) result.push(trimmed);
            current = "";
          } else {
            current += ch;
          }
        }
      }
      const trimmed = current.trim();
      if (trimmed) result.push(trimmed);
      return result;
    };
    const lines = parseCSVLines(text);
    if (lines.length < 2) {
      toast({ title: "CSV 檔案格式錯誤或無資料", variant: "destructive" });
      return;
    }

    // RFC 4180 CSV parser that handles quoted fields with commas, newlines, and escaped quotes
    const parseCSVLine = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++; // skip escaped quote
            } else {
              inQuotes = false;
            }
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            result.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);

    // Build a label-to-key mapping from form fields_config
    const labelToKey = {};
    forms.forEach((form) => {
      (form.fields_config || []).forEach((f) => {
        if (f.label) labelToKey[f.label] = f.key;
        if (f.key) labelToKey[f.key] = f.key;
      });
    });

    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      // Skip lines that start with note markers
      if (lines[i].startsWith("【") || lines[i].startsWith("•")) continue;

      // Use proper CSV parser for values
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const name = row["姓名"] || row["name"] || row["Name"] || "";
      const email = row["電郵"] || row["email"] || row["Email"] || "";
      const guestCountStr = row["同行人數"] || row["guest_count"] || "0";
      const guestNames = (row["同行人姓名"] || row["guest_names"] || "")
        .split(/[、,，]/).map(s => s.trim()).filter(Boolean);

      // Build form_data from all columns, mapping labels back to keys
      const formData = {};
      Object.entries(row).forEach(([header, value]) => {
        const key = labelToKey[header] || header;
        formData[key] = value;
      });
      // Ensure name/email fields are set
      if (name) formData["name"] = name;
      if (email) formData["email"] = email;
      // Resolve section_id(s) from section name — support multi-value (comma/、/，separated)
      const sectionNameRaw = row["場次"] || "";
      let resolvedSectionIds = [];
      if (sectionNameRaw) {
        // Split by comma, 、or ， to support multi-value
        const sectionNames = sectionNameRaw.split(/[,、，]/).map(s => s.trim()).filter(Boolean);
        sectionNames.forEach((sn) => {
          const matchedSection = sections.find(
            (s) => s.name === sn || s.name?.trim() === sn.trim()
          );
          if (matchedSection) resolvedSectionIds.push(matchedSection.id);
        });
        // If no sections matched but we have section names, try single match as fallback
        if (resolvedSectionIds.length === 0) {
          const matchedSection = sections.find(
            (s) => s.name === sectionNameRaw.trim() || s.name?.trim() === sectionNameRaw.trim()
          );
          if (matchedSection) resolvedSectionIds.push(matchedSection.id);
        }
      }

      // Remove meta fields from form_data
      delete formData["同行人數"];
      delete formData["同行人姓名"];
      delete formData["guest_count"];
      delete formData["guest_names"];
      delete formData["場次"];
      delete formData["報名狀態"];
      delete formData["報名時間"];
      delete formData["邀請人"];

      // If multiple sections, create one registration per section (like multi_section mode)
      if (resolvedSectionIds.length > 1) {
        for (const secId of resolvedSectionIds) {
          const { error } = await supabase.from("event_registrations").insert({
            event_id: eventId,
            section_id: secId,
            form_data: formData,
            guest_count: parseInt(guestCountStr) || 0,
            guest_names: guestNames.length > 0 ? guestNames : null,
            status: "confirmed",
            registration_status: "pending",
            registered_at: new Date().toISOString(),
          });
          if (!error) imported++;
        }
      } else {
        const { error } = await supabase.from("event_registrations").insert({
          event_id: eventId,
          section_id: resolvedSectionIds[0] || null,
          form_data: formData,
          guest_count: parseInt(guestCountStr) || 0,
          guest_names: guestNames.length > 0 ? guestNames : null,
          status: "confirmed",
          registration_status: "pending",
          registered_at: new Date().toISOString(),
        });
        if (!error) imported++;
      }
    }

    toast({ title: `成功匯入 ${imported} 筆報名記錄` });
    fetchRegistrations();
    // Reset file input
    e.target.value = "";
  };

  // Group registrations by person (same email or same form_data identity)
  const getPersonKey = (reg) => {
    const email = reg.form_data?.email || reg.form_data?.電郵 || "";
    const name = reg.form_data?.name || reg.form_data?.姓名 || "";
    if (email) return email.toLowerCase();
    if (name) return `name:${name}`;
    return `id:${reg.id}`;
  };

  // Total unique people (unfiltered) including guests
  const totalPeople = (() => {
    const keys = new Set();
    let total = 0;
    registrations.forEach((r) => {
      const key = getPersonKey(r);
      if (!keys.has(key)) {
        keys.add(key);
        total += 1 + (r.guest_count || 0);
      }
    });
    return total;
  })();

  const totalRegistrants = (() => {
    const keys = new Set();
    registrations.forEach((r) => keys.add(getPersonKey(r)));
    return keys.size;
  })();

  const filtered = registrations.filter((r) => {
    const text = JSON.stringify(r.form_data || {}).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // Group by person
  const grouped = [];
  const groupMap = new Map();
  filtered.forEach((reg) => {
    const key = getPersonKey(reg);
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, registrations: [] });
      grouped.push(groupMap.get(key));
    }
    groupMap.get(key).registrations.push(reg);
  });

  // Get all form fields for the add dialog
  const allFormFields = (() => {
    const fields = [];
    const seen = new Set();
    forms.forEach((form) => {
      (form.fields_config || []).forEach((f) => {
        if (!seen.has(f.key)) {
          seen.add(f.key);
          fields.push(f);
        }
      });
    });
    if (fields.length === 0) {
      fields.push(
        { key: "name", label: "姓名", type: "text", required: true },
        { key: "email", label: "電郵", type: "email", required: false },
        { key: "phone", label: "電話", type: "text", required: false },
        { key: "company", label: "公司名字", type: "text", required: false },
      );
    }
    return fields;
  })();

  const maxGuests = Math.max(0, ...forms.map((f) => f.max_guests_per_registration || 0));

  const openAddDialog = () => {
    const initial = {};
    allFormFields.forEach((f) => { initial[f.key] = ""; });
    setAddFormData(initial);
    setAddMeta({ guest_count: "0", guest_names: "", section_ids: [] });
    setShowAddDialog(true);
  };

  const handleManualAdd = async () => {
    // Validate required fields
    const missing = allFormFields.filter((f) => f.required && !addFormData[f.key]?.trim());
    if (missing.length > 0) {
      toast({ title: `請填寫必填欄位：${missing.map(f => f.label || f.key).join("、")}`, variant: "destructive" });
      return;
    }

    setAddSubmitting(true);
    const guestCount = parseInt(addMeta.guest_count) || 0;
    const guestNames = addMeta.guest_names
      .split(/[、,，]/).map(s => s.trim()).filter(Boolean);

    const sectionIds = addMeta.section_ids || [];
    let success = false;

    if (sectionIds.length > 1) {
      // Multi-section: create one registration per section
      let allOk = true;
      for (const secId of sectionIds) {
        const { error } = await supabase.from("event_registrations").insert({
          event_id: eventId,
          section_id: secId,
          form_data: { ...addFormData },
          guest_count: guestCount,
          guest_names: guestNames.length > 0 ? guestNames : null,
          status: "confirmed",
          registration_status: "pending",
          registered_at: new Date().toISOString(),
        });
        if (error) allOk = false;
      }
      success = allOk;
    } else {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        section_id: sectionIds[0] || null,
        form_data: { ...addFormData },
        guest_count: guestCount,
        guest_names: guestNames.length > 0 ? guestNames : null,
        status: "confirmed",
        registration_status: "pending",
        registered_at: new Date().toISOString(),
      });
      success = !error;
      if (error) {
        toast({ title: "新增失敗", description: error.message, variant: "destructive" });
      }
    }

    setAddSubmitting(false);
    if (success) {
      toast({ title: "已成功新增報名記錄" });
      setShowAddDialog(false);
      fetchRegistrations();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">👥 報名清單 ({totalRegistrants} 報名，共 {totalPeople} 人)</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} title="下載匯入範本">
            <FileDown className="w-4 h-4 mr-1" />
            範本
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById(`import-csv-${eventId}`).click()}>
            <Upload className="w-4 h-4 mr-1" />
            匯入 CSV
          </Button>
          <input
            id={`import-csv-${eventId}`}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={importCSV}
          />
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" />
            匯出 CSV
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-1" />
            手動新增
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋報名者..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">載入中...</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暫無報名記錄</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>電郵</TableHead>
                  <TableHead>同行人</TableHead>
                  <TableHead>場次</TableHead>
                  <TableHead>報名狀態</TableHead>
                  <TableHead>報名時間</TableHead>
                  <TableHead>邀請人</TableHead>
                  <TableHead>跟進人</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((group) => {
                  const first = group.registrations[0];
                  const name = first.form_data?.name || first.form_data?.姓名 || "-";
                  const email = first.form_data?.email || first.form_data?.電郵 || "-";
                  const guestCount = first.guest_count || 0;
                  const guestNamesList = first.guest_names || [];
                  const sectionNames = group.registrations
                    .map((r) => r.event_sections?.name)
                    .filter(Boolean);
                  const _invId = first.invited_by_staff_id ? String(first.invited_by_staff_id).trim() : null;
                  const inviterName = (_invId && staffMap[_invId]) || (_invId ? _invId : "-");
                  if (_invId && !staffMap[_invId]) {
                    console.warn("[RegistrationList] inviter not found in staffMap:", _invId, "staffMap has", Object.keys(staffMap).length, "keys");
                  }
                  const regTime = first.registered_at
                    ? new Date(first.registered_at).toLocaleString("zh-HK")
                    : "-";
                  const regStatus = first.registration_status || "pending";
                  const allIds = group.registrations.map((r) => r.id);

                  return (
                    <TableRow key={group.key}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>
                        {guestCount > 0 ? (
                          <div>
                            <Badge variant="secondary" className="text-xs">{guestCount} 位</Badge>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {guestNamesList.join("、")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sectionNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {group.registrations
                              .filter((r) => r.event_sections?.name)
                              .map((r, i) => (
                              <Badge key={i} variant="outline" className="text-xs" title={r.event_sections?.name}>
                                {getSectionLabel(r.event_sections?.name, r.section_id)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={regStatus}
                          onValueChange={(val) => updateGroupStatus(allIds, val)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REG_STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${opt.color}`}>
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">{regTime}</TableCell>
                      <TableCell className="text-xs">{inviterName}</TableCell>
                      <TableCell>
                        <StaffPicker
                          staffList={staffList}
                          currentValue={first.followed_by}
                          staffMap={staffMap}
                          onSelect={(staffId) => updateFollowedBy(allIds, staffId)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGroupRegistrations(allIds)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Manual Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>手動新增報名</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {allFormFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-sm">
                  {field.label || field.key}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === "select" && field.options?.length > 0 ? (
                  <Select
                    value={addFormData[field.key] || ""}
                    onValueChange={(val) => setAddFormData((prev) => ({ ...prev, [field.key]: val }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={`選擇${field.label || field.key}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    value={addFormData[field.key] || ""}
                    onChange={(e) => setAddFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || ""}
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                    value={addFormData[field.key] || ""}
                    onChange={(e) => setAddFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || ""}
                  />
                )}
              </div>
            ))}

            {sections.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">場次（可多選）</Label>
                <div className="space-y-1 border rounded-md p-2 max-h-40 overflow-y-auto">
                  {sections.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(addMeta.section_ids || []).includes(s.id)}
                        onChange={(e) => {
                          setAddMeta((prev) => {
                            const ids = prev.section_ids || [];
                            if (e.target.checked) {
                              return { ...prev, section_ids: [...ids, s.id] };
                            } else {
                              return { ...prev, section_ids: ids.filter((id) => id !== s.id) };
                            }
                          });
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {maxGuests > 0 && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm">同行人數</Label>
                  <Input
                    type="number"
                    min="0"
                    max={maxGuests}
                    value={addMeta.guest_count}
                    onChange={(e) => setAddMeta((prev) => ({ ...prev, guest_count: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">同行人姓名（用「、」分隔）</Label>
                  <Input
                    value={addMeta.guest_names}
                    onChange={(e) => setAddMeta((prev) => ({ ...prev, guest_names: e.target.value }))}
                    placeholder="李四、王五"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button onClick={handleManualAdd} disabled={addSubmitting}>
              {addSubmitting ? "新增中..." : "新增報名"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
