import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Download,
  Search,
  X,
  Users,
  MapPin,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
  not_prepared: { label: "未準備", color: "bg-gray-100 text-gray-700" },
  prepared: { label: "已準備", color: "bg-green-100 text-green-700" },
  used: { label: "已使用", color: "bg-blue-100 text-blue-700" },
};

// Staff Picker Popover - uses fixed positioning to avoid overflow clipping
function StaffPicker({ value, onSelect, staffList }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(!open);
  };

  const filtered = staffList.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.display_name || "").toLowerCase().includes(q) ||
      (s.team_name || "").toLowerCase().includes(q) ||
      (s.position || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1 text-sm text-left focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white h-8"
      >
        <span className={`flex-1 truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value || "選擇負責人"}
        </span>
        {value ? (
          <X
            size={14}
            className="text-gray-400 hover:text-red-500 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onSelect("", "");
            }}
          />
        ) : (
          <Search size={14} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div
          ref={ref}
          className="fixed w-60 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-2 text-gray-400" />
              <input
                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
                placeholder="搜尋姓名、Team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-center py-3 text-sm text-gray-400">無符合結果</div>
            )}
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s.display_name, s.bubble_id);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 ${
                  s.display_name === value ? "bg-blue-50" : ""
                }`}
              >
                {s.profile_pic ? (
                  <img src={s.profile_pic} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {(s.display_name || "?")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{s.display_name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {s.team_name} · {s.position || "—"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Multi-section picker with fixed positioning
function MultiSectionPicker({ value = [], onChange, sections }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(!open);
  };

  const toggleSection = (sId) => {
    const newVal = value.includes(sId) ? value.filter((v) => v !== sId) : [...value, sId];
    onChange(newVal);
  };

  const selectedNames = sections.filter((s) => value.includes(s.id)).map((s) => s.name);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1 text-sm text-left focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white min-h-[32px] min-w-0"
        title={selectedNames.join(", ")}
      >
        <span className={`flex-1 min-w-0 ${selectedNames.length > 0 ? "text-gray-900" : "text-gray-400"}`}>
          {selectedNames.length > 0 ? (
            <span className="flex flex-wrap gap-0.5">
              {selectedNames.map((n, i) => (
                <span key={i} className="inline-block bg-blue-50 text-blue-700 text-[10px] px-1 rounded">{n}</span>
              ))}
            </span>
          ) : "選擇場次"}
        </span>
        {selectedNames.length > 0 && (
          <X
            size={14}
            className="text-gray-400 hover:text-red-500 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
          />
        )}
      </button>

      {open && (
        <div
          ref={ref}
          className="fixed w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="max-h-56 overflow-y-auto p-1">
            {sections.map((s) => {
              const checked = value.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSection(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-blue-50 transition-colors ${checked ? "bg-blue-50" : ""}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                    {checked && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// Inline editable cell
function InlineEditCell({ value, onChange, type = "text", placeholder = "", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editing) {
    return (
      <div
        className={`cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded text-sm min-h-[28px] flex items-center ${className}`}
        onClick={() => {
          setTempVal(value || "");
          setEditing(true);
        }}
      >
        {value || <span className="text-gray-300 italic">{placeholder}</span>}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      className="border border-blue-300 rounded px-1.5 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
      value={tempVal}
      onChange={(e) => setTempVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (tempVal !== (value || "")) onChange(tempVal);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          if (tempVal !== (value || "")) onChange(tempVal);
        }
        if (e.key === "Escape") {
          setEditing(false);
          setTempVal(value || "");
        }
      }}
      placeholder={placeholder}
    />
  );
}

export default function MaterialManager({ eventId }) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [sections, setSections] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickName, setQuickName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStaffOpen, setBulkStaffOpen] = useState(false);
  const [bulkSectionOpen, setBulkSectionOpen] = useState(false);

  useEffect(() => {
    fetchMaterials();
    fetchSections();
    fetchStaff();
  }, [eventId]);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_materials")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at");
    if (data) setMaterials(data);
    setLoading(false);
  };

  const fetchSections = async () => {
    const { data } = await supabase
      .from("event_sections")
      .select("id, name")
      .eq("event_id", eventId)
      .order("sort_order");
    if (data) setSections(data);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("id, display_name, team_name, position, profile_pic, bubble_id")
      .eq("o_status", "Active")
      .order("display_name");
    if (data) setStaffList(data);
  };

  const handleQuickAdd = async () => {
    const name = quickName.trim();
    if (!name) return;

    const { error } = await supabase.from("event_materials").insert({
      event_id: eventId,
      name,
      quantity: 1,
      status: "not_prepared",
      section_ids: [],
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "新增失敗", description: error.message, variant: "destructive" });
    } else {
      setQuickName("");
      fetchMaterials();
    }
  };

  const updateField = async (id, field, value) => {
    // Optimistic local update (no refetch)
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
    await supabase
      .from("event_materials")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  const deleteMaterial = async (id) => {
    if (!confirm("確定刪除此物資？")) return;
    await supabase.from("event_materials").delete().eq("id", id);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    fetchMaterials();
    toast({ title: "物資已刪除" });
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`確定刪除 ${selectedIds.length} 項物資？`)) return;
    await supabase.from("event_materials").delete().in("id", selectedIds);
    setSelectedIds([]);
    fetchMaterials();
    toast({ title: `已刪除 ${selectedIds.length} 項物資` });
  };

  const bulkAssignPerson = async (name) => {
    if (selectedIds.length === 0) return;
    // Optimistic update
    setMaterials((prev) =>
      prev.map((m) => selectedIds.includes(m.id) ? { ...m, responsible_person: name } : m)
    );
    setSelectedIds([]);
    setBulkStaffOpen(false);
    await supabase
      .from("event_materials")
      .update({ responsible_person: name, updated_at: new Date().toISOString() })
      .in("id", selectedIds);
    toast({ title: `已指派 ${name} 為負責人` });
  };

  const bulkAssignSection = async (sectionId) => {
    if (selectedIds.length === 0) return;
    // Optimistic update
    setMaterials((prev) =>
      prev.map((m) => {
        if (!selectedIds.includes(m.id)) return m;
        const current = m.section_ids || [];
        if (sectionId && !current.includes(sectionId)) {
          return { ...m, section_ids: [...current, sectionId] };
        } else if (!sectionId) {
          return { ...m, section_ids: [] };
        }
        return m;
      })
    );
    const idsToUpdate = [...selectedIds];
    setSelectedIds([]);
    setBulkSectionOpen(false);
    // DB update
    for (const id of idsToUpdate) {
      const m = materials.find((mat) => mat.id === id);
      const current = m?.section_ids || [];
      if (sectionId && !current.includes(sectionId)) {
        await supabase
          .from("event_materials")
          .update({ section_ids: [...current, sectionId], updated_at: new Date().toISOString() })
          .eq("id", id);
      } else if (!sectionId) {
        await supabase
          .from("event_materials")
          .update({ section_ids: [], updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    }
    toast({ title: "已批量指派場次" });
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedIds.length === 0) return;
    // Optimistic update
    setMaterials((prev) =>
      prev.map((m) => selectedIds.includes(m.id) ? { ...m, status } : m)
    );
    const idsToUpdate = [...selectedIds];
    setSelectedIds([]);
    await supabase
      .from("event_materials")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", idsToUpdate);
    toast({ title: `已批量更新狀態為「${STATUS_CONFIG[status]?.label}」` });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === materials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(materials.map((m) => m.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    if (materials.length === 0) {
      toast({ title: "無物資可匯出", variant: "destructive" });
      return;
    }
    const headers = ["名稱", "數量", "負責人", "預算", "狀態", "場次", "備註"];
    const rows = materials.map((m) => {
      const sIds = m.section_ids || [];
      const secNames = sections.filter((s) => sIds.includes(s.id)).map((s) => s.name).join(", ");
      return [
        m.name,
        m.quantity,
        m.responsible_person || "",
        m.budget || "",
        STATUS_CONFIG[m.status]?.label || m.status,
        secNames,
        m.notes || "",
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `物資清單.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已匯出物資清單" });
  };

  const totalBudget = materials.reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0);
  const preparedCount = materials.filter(
    (m) => m.status === "prepared" || m.status === "used"
  ).length;

  const showSections = sections.length > 1;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">📦 物資列表</CardTitle>
            {materials.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                共 {materials.length} 項 · 已準備 {preparedCount}/{materials.length}
                {totalBudget > 0 && ` · 預算合計 $${totalBudget.toLocaleString()}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {materials.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-1" />
                匯出
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Add Row */}
          <div className="flex gap-2">
            <Input
              className="flex-1 h-9 text-sm"
              placeholder="輸入物資名稱，按 Enter 快速新增..."
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAdd();
              }}
            />
            <Button size="sm" className="h-9" onClick={handleQuickAdd} disabled={!quickName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              新增
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex-wrap">
              <span className="text-sm font-medium text-blue-700">
                已選 {selectedIds.length} 項
              </span>
              <div className="flex gap-1 flex-wrap">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setBulkStaffOpen(!bulkStaffOpen);
                      setBulkSectionOpen(false);
                    }}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    指派負責人
                  </Button>
                  {bulkStaffOpen && (
                    <BulkStaffDropdown
                      staffList={staffList}
                      onSelect={(name) => bulkAssignPerson(name)}
                      onClose={() => setBulkStaffOpen(false)}
                    />
                  )}
                </div>

                {showSections && (
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setBulkSectionOpen(!bulkSectionOpen);
                        setBulkStaffOpen(false);
                      }}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      指派場次
                    </Button>
                    {bulkSectionOpen && (
                      <BulkSectionDropdown
                        sections={sections}
                        onSelect={(id) => bulkAssignSection(id)}
                        onClose={() => setBulkSectionOpen(false)}
                      />
                    )}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => bulkUpdateStatus("prepared")}
                >
                  <Check className="w-3 h-3 mr-1" />
                  標記已準備
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={deleteSelected}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  刪除
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs ml-auto"
                onClick={() => setSelectedIds([])}
              >
                取消選取
              </Button>
            </div>
          )}

          {/* Materials Table */}
          {loading ? (
            <p className="text-sm text-muted-foreground">載入中...</p>
          ) : materials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              尚未新增物資，請於上方輸入名稱快速新增
            </p>
          ) : (
            <div className="border rounded-lg overflow-visible">
              {/* Table Header */}
              <div className={`grid gap-2 px-3 py-2.5 bg-gray-50 border-b text-xs font-semibold text-gray-600 ${showSections ? "grid-cols-[36px_minmax(80px,1fr)_55px_minmax(110px,1.2fr)_65px_minmax(90px,1fr)_50px_minmax(100px,1.2fr)_36px]" : "grid-cols-[36px_minmax(80px,1.2fr)_55px_minmax(110px,1.2fr)_65px_50px_minmax(100px,1.5fr)_36px]"}`}>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedIds.length === materials.length && materials.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </div>
                <div>名稱</div>
                <div>數量</div>
                <div>負責人</div>
                <div>預算</div>
                {showSections && <div>場次</div>}
                <div>狀態</div>
                <div>備註</div>
                <div></div>
              </div>

              {/* Table Rows */}
              {materials.map((m) => {
                const sectionIds = m.section_ids || [];
                return (
                  <div
                    key={m.id}
                    className={`grid gap-2 px-3 py-2 border-b last:border-b-0 items-center hover:bg-gray-50/50 ${showSections ? "grid-cols-[36px_minmax(80px,1fr)_55px_minmax(110px,1.2fr)_65px_minmax(90px,1fr)_50px_minmax(100px,1.2fr)_36px]" : "grid-cols-[36px_minmax(80px,1.2fr)_55px_minmax(110px,1.2fr)_65px_50px_minmax(100px,1.5fr)_36px]"} ${
                      selectedIds.includes(m.id) ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedIds.includes(m.id)}
                        onCheckedChange={() => toggleSelect(m.id)}
                      />
                    </div>

                    {/* Name - compact, wraps if needed */}
                    <InlineEditCell
                      value={m.name}
                      onChange={(v) => updateField(m.id, "name", v)}
                      placeholder="物資名稱"
                      className="font-medium break-words"
                    />

                    {/* Quantity */}
                    <InlineEditCell
                      value={m.quantity?.toString()}
                      onChange={(v) => updateField(m.id, "quantity", parseInt(v) || 1)}
                      type="number"
                      placeholder="1"
                    />

                    {/* Person - Staff Picker */}
                    <StaffPicker
                      value={m.responsible_person}
                      staffList={staffList}
                      onSelect={(name) => updateField(m.id, "responsible_person", name || null)}
                    />

                    {/* Budget */}
                    <InlineEditCell
                      value={m.budget?.toString() || ""}
                      onChange={(v) => updateField(m.id, "budget", v ? parseFloat(v) : null)}
                      type="number"
                      placeholder="$0"
                    />

                    {/* Section - Multi select (only if >1 section) */}
                    {showSections && (
                      <MultiSectionPicker
                        value={sectionIds}
                        sections={sections}
                        onChange={(newIds) => updateField(m.id, "section_ids", newIds)}
                      />
                    )}

                    {/* Status - Checklist style */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          updateField(m.id, "status", m.status === "prepared" ? "not_prepared" : "prepared")
                        }
                        className="flex items-center"
                        title={m.status === "prepared" ? "已準備 (點擊取消)" : "未準備 (點擊標記已準備)"}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          m.status === "prepared" || m.status === "used"
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 bg-white hover:border-gray-400"
                        }`}>
                          {(m.status === "prepared" || m.status === "used") && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Notes / Remark */}
                    <InlineEditCell
                      value={m.notes || ""}
                      onChange={(v) => updateField(m.id, "notes", v || null)}
                      placeholder="備註..."
                      className="text-gray-500"
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteMaterial(m.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Bulk Staff dropdown
function BulkStaffDropdown({ staffList, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = staffList.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.display_name || "").toLowerCase().includes(q) ||
      (s.team_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[60] overflow-hidden"
    >
      <div className="p-2 border-b">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2 text-gray-400" />
          <input
            className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-50 focus:outline-none"
            placeholder="搜尋同事..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-3 text-sm text-gray-400">無符合結果</div>
        )}
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.display_name)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-50"
          >
            {s.profile_pic ? (
              <img src={s.profile_pic} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {(s.display_name || "?")[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{s.display_name}</div>
              <div className="text-xs text-gray-400 truncate">{s.team_name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Bulk Section dropdown
function BulkSectionDropdown({ sections, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[60] overflow-hidden"
    >
      <div className="max-h-48 overflow-y-auto">
        <button
          onClick={() => onSelect(null)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
        >
          全部場次（清除）
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-50"
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
