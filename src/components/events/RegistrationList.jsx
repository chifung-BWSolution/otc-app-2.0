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
import { Search, Download, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const REG_STATUS_OPTIONS = [
  { value: "pending", label: "待處理", color: "bg-gray-100 text-gray-700" },
  { value: "rsvp_sent", label: "已傳送RSVP", color: "bg-blue-100 text-blue-700" },
  { value: "awaiting_confirm", label: "待確認", color: "bg-yellow-100 text-yellow-700" },
  { value: "attending", label: "會出席", color: "bg-green-100 text-green-700" },
  { value: "not_attending", label: "不會出席", color: "bg-red-100 text-red-700" },
];

export default function RegistrationList({ eventId }) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRegistrations();
    fetchStaffMap();
  }, [eventId]);

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

    // 1) Try staff table directly (may be limited by RLS)
    const { data, error: staffErr } = await supabase
      .from("staff")
      .select("id, bubble_id, chinese_name, display_name, full_name, work_email");
    if (staffErr) {
      console.warn("[RegistrationList] staff table query failed:", staffErr.message);
    }
    if (data) {
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
    }

    // 2) Also fetch from publicStaffList edge function (bypasses RLS, uses bubble_id as id)
    try {
      const res = await supabase.functions.invoke("publicStaffList");
      // res.data could be: { data: [...] } (parsed JSON) or a string
      let staffList = [];
      if (res.data) {
        let parsed = res.data;
        // If it's a string, parse it
        if (typeof parsed === "string") {
          try { parsed = JSON.parse(parsed); } catch (_) { /* ignore */ }
        }
        // Now extract the array
        if (Array.isArray(parsed)) {
          staffList = parsed;
        } else if (parsed?.data && Array.isArray(parsed.data)) {
          staffList = parsed.data;
        }
      }
      console.log("[RegistrationList] publicStaffList loaded:", staffList.length, "staff");
      staffList.forEach((s) => {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">👥 報名清單 ({totalRegistrants} 報名，共 {totalPeople} 人)</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" />
          匯出 CSV
        </Button>
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
                            {sectionNames.map((sn, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {sn}
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
    </Card>
  );
}
