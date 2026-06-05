import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Link2, Edit, CopyPlus, X, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const FIELD_TYPES = [
  { value: "text", label: "文字" },
  { value: "email", label: "電郵" },
  { value: "tel", label: "電話" },
  { value: "textarea", label: "長文字" },
  { value: "select", label: "下拉選項" },
  { value: "dynamic_staff", label: "員工列表（動態）" },
  { value: "number", label: "數字" },
];

const DEFAULT_FIELDS = [
  { key: "name", label: "姓名", type: "text", required: true },
  { key: "department", label: "部門", type: "text", required: false },
  { key: "position", label: "職位", type: "text", required: false },
  { key: "email", label: "電郵", type: "email", required: true },
  { key: "phone", label: "電話", type: "tel", required: false },
  { key: "dietary", label: "飲食偏好", type: "select", options: ["葷", "素", "清真", "無特別"], required: false },
  { key: "special_request", label: "特別要求", type: "textarea", required: false },
];

function generateSlug() {
  return Math.random().toString(36).substring(2, 10);
}

export default function FormBuilder({ eventId, onFormCreated }) {
  const { toast } = useToast();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [sections, setSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [maxGuests, setMaxGuests] = useState(0);
  const [showInviterField, setShowInviterField] = useState(true);
  const [sectionSelectionMode, setSectionSelectionMode] = useState("single");
  const [staffFilterTeams, setStaffFilterTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    fetchForms();
    fetchSections();
    fetchAvailableTeams();
  }, [eventId]);

  const fetchForms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("registration_forms")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at");
    if (data) setForms(data);
    setLoading(false);
  };

  const fetchSections = async () => {
    const { data } = await supabase
      .from("event_sections")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order");
    if (data) setSections(data);
  };

  const fetchAvailableTeams = async () => {
    const { data } = await supabase
      .from("staff")
      .select("team_name")
      .eq("o_status", "Active")
      .not("team_name", "is", null);
    if (data) {
      const unique = [...new Set(data.map((d) => d.team_name).filter(Boolean))].sort();
      setAvailableTeams(unique);
    }
  };

  const createForm = async () => {
    if (!formTitle.trim()) {
      toast({ title: "請輸入表格標題", variant: "destructive" });
      return;
    }
    const slug = generateSlug();
    const { error } = await supabase.from("registration_forms").insert({
      event_id: eventId,
      title: formTitle,
      fields_config: fields,
      slug,
      is_active: true,
      section_ids: selectedSectionIds,
      max_guests_per_registration: maxGuests,
      show_inviter_field: showInviterField,
      section_selection_mode: sectionSelectionMode,
      staff_filter_teams: staffFilterTeams,
    });
    if (error) {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "報名表格已建立" });
      setShowNewForm(false);
      resetFormEditor();
      fetchForms();
      onFormCreated?.();
    }
  };

  const updateForm = async () => {
    if (!formTitle.trim()) {
      toast({ title: "請輸入表格標題", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("registration_forms")
      .update({
        title: formTitle,
        fields_config: fields,
        section_ids: selectedSectionIds,
        max_guests_per_registration: maxGuests,
        show_inviter_field: showInviterField,
        section_selection_mode: sectionSelectionMode,
        staff_filter_teams: staffFilterTeams,
      })
      .eq("id", editingForm.id);
    if (error) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "報名表格已更新" });
      setEditingForm(null);
      resetFormEditor();
      fetchForms();
      onFormCreated?.();
    }
  };

  const toggleActive = async (form) => {
    const { error } = await supabase
      .from("registration_forms")
      .update({ is_active: !form.is_active })
      .eq("id", form.id);
    if (error) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: form.is_active ? "表格已停用" : "表格已啟用" });
      fetchForms();
      onFormCreated?.();
    }
  };

  const duplicateForm = async (form) => {
    const slug = generateSlug();
    const { error } = await supabase.from("registration_forms").insert({
      event_id: eventId,
      title: `${form.title} (副本)`,
      fields_config: form.fields_config,
      slug,
      is_active: false,
      section_ids: form.section_ids || [],
      max_guests_per_registration: form.max_guests_per_registration || 0,
      show_inviter_field: form.show_inviter_field ?? true,
      section_selection_mode: form.section_selection_mode || "single",
      staff_filter_teams: form.staff_filter_teams || [],
    });
    if (error) {
      toast({ title: "複製失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "表格已複製" });
      fetchForms();
    }
  };

  const startEdit = (form) => {
    setEditingForm(form);
    setFormTitle(form.title);
    setFields(form.fields_config || DEFAULT_FIELDS);
    setSelectedSectionIds(form.section_ids || []);
    setMaxGuests(form.max_guests_per_registration || 0);
    setShowInviterField(form.show_inviter_field ?? true);
    setSectionSelectionMode(form.section_selection_mode || "single");
    setStaffFilterTeams(form.staff_filter_teams || []);
    setShowNewForm(false);
  };

  const resetFormEditor = () => {
    setFormTitle("");
    setFields(DEFAULT_FIELDS);
    setSelectedSectionIds([]);
    setMaxGuests(0);
    setShowInviterField(true);
    setSectionSelectionMode("single");
    setStaffFilterTeams([]);
    setTeamSearch("");
  };

  const cancelEdit = () => {
    setEditingForm(null);
    resetFormEditor();
  };

  const deleteForm = async (id) => {
    if (!confirm("確定刪除此報名表格？")) return;
    await supabase.from("registration_forms").delete().eq("id", id);
    fetchForms();
    toast({ title: "表格已刪除" });
  };

  const copyLink = (slug) => {
    const link = `${window.location.origin}/register/${slug}`;
    try {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({ title: "已複製報名連結" });
    } catch (err) {
      navigator.clipboard.writeText(link).then(() => {
        toast({ title: "已複製報名連結" });
      }).catch(() => {
        toast({ title: "無法複製連結，請手動複製", variant: "destructive" });
      });
    }
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { key: `field_${Date.now()}`, label: "", type: "text", required: false },
    ]);
  };

  const updateField = (index, key, value) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Options management for select fields
  const addOption = (fieldIndex) => {
    setFields((prev) => {
      const updated = [...prev];
      const options = updated[fieldIndex].options || [];
      updated[fieldIndex] = { ...updated[fieldIndex], options: [...options, ""] };
      return updated;
    });
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    setFields((prev) => {
      const updated = [...prev];
      const options = [...(updated[fieldIndex].options || [])];
      options[optionIndex] = value;
      updated[fieldIndex] = { ...updated[fieldIndex], options };
      return updated;
    });
  };

  const removeOption = (fieldIndex, optionIndex) => {
    setFields((prev) => {
      const updated = [...prev];
      const options = (updated[fieldIndex].options || []).filter((_, i) => i !== optionIndex);
      updated[fieldIndex] = { ...updated[fieldIndex], options };
      return updated;
    });
  };

  const isEditing = showNewForm || editingForm;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">📝 報名表格</CardTitle>
        {!isEditing && (
          <Button size="sm" onClick={() => { setShowNewForm(true); setEditingForm(null); resetFormEditor(); }}>
            <Plus className="w-4 h-4 mr-1" />
            新增表格
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing forms */}
        {!isEditing && forms.map((form) => (
          <div key={form.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{form.title}</p>
                <p className="text-xs text-muted-foreground">
                  {form.fields_config?.length || 0} 個欄位
                  {form.max_guests_per_registration > 0 && ` · 最多帶 ${form.max_guests_per_registration} 位同行`}
                </p>
                {form.section_ids?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {form.section_ids.map((sId) => {
                      const sec = sections.find((s) => s.id === sId);
                      return sec ? (
                        <Badge key={sId} variant="secondary" className="text-xs">
                          {sec.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">啟用</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={() => toggleActive(form)}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => startEdit(form)}>
                <Edit className="w-3.5 h-3.5 mr-1" />
                編輯
              </Button>
              <Button variant="outline" size="sm" onClick={() => duplicateForm(form)}>
                <CopyPlus className="w-3.5 h-3.5 mr-1" />
                複製
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyLink(form.slug)}>
                <Link2 className="w-3.5 h-3.5 mr-1" />
                連結
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteForm(form.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                刪除
              </Button>
            </div>
          </div>
        ))}

        {forms.length === 0 && !isEditing && (
          <p className="text-sm text-muted-foreground text-center py-4">
            尚未建立報名表格
          </p>
        )}

        {/* Form editor (new or editing) */}
        {isEditing && (
          <div className="border rounded-lg p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-base">
                {editingForm ? `編輯表格：${editingForm.title}` : "新增報名表格"}
              </Label>
            </div>
            <div>
              <Label>表格標題</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：活動報名表"
                className="bg-white border-slate-300"
              />
            </div>

            {/* Section assignment */}
            {sections.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">此表格適用場次（可多選）</Label>
                <div className="grid grid-cols-2 gap-2">
                  {sections.map((sec) => (
                    <label key={sec.id} className="flex items-center gap-2 text-sm p-2 border rounded-md bg-white cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedSectionIds.includes(sec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSectionIds((prev) => [...prev, sec.id]);
                          } else {
                            setSelectedSectionIds((prev) => prev.filter((id) => id !== sec.id));
                          }
                        }}
                      />
                      {sec.name}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  不勾選代表所有場次都適用
                </p>
                <div className="mt-2">
                  <Label className="text-sm">報名者選擇場次模式</Label>
                  <Select value={sectionSelectionMode} onValueChange={setSectionSelectionMode}>
                    <SelectTrigger className="w-48 bg-white border-slate-300 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">單選（只選一場）</SelectItem>
                      <SelectItem value="multi">多選（可選多場）</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sectionSelectionMode === "multi"
                      ? "報名者可一次報名多個場次，每場會產生獨立報名記錄"
                      : "報名者只能選擇一個場次"}
                  </p>
                </div>
              </div>
            )}

            {/* Max guests setting */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                每位報名者最多帶幾位同行人（0 = 不可帶人）
              </Label>
              <Input
                type="number"
                min="0"
                max="20"
                value={maxGuests}
                onChange={(e) => setMaxGuests(parseInt(e.target.value) || 0)}
                className="w-32 bg-white border-slate-300"
              />
              <p className="text-xs text-muted-foreground">
                報名者需填寫每位同行者姓名，此資料會連結至出席名單及座位表
              </p>
            </div>

            {/* Show inviter field */}
            <div className="flex items-center gap-3">
              <Switch
                checked={showInviterField}
                onCheckedChange={setShowInviterField}
              />
              <Label className="text-sm">顯示「邊位同事邀請你」欄位</Label>
            </div>

            {/* Staff filter by team */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                限定員工列表顯示的團隊（留空顯示全部）
              </Label>
              {availableTeams.length > 0 ? (
                <div className="space-y-2">
                  <Input
                    placeholder="搜尋團隊..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        const filtered = availableTeams.filter((t) =>
                          t.toLowerCase().includes(teamSearch.toLowerCase())
                        );
                        setStaffFilterTeams((prev) => [...new Set([...prev, ...filtered])]);
                      }}
                    >
                      全選{teamSearch ? "（篩選結果）" : ""}
                    </button>
                    <button
                      type="button"
                      className="text-red-500 hover:underline"
                      onClick={() => {
                        if (teamSearch) {
                          const filtered = availableTeams.filter((t) =>
                            t.toLowerCase().includes(teamSearch.toLowerCase())
                          );
                          setStaffFilterTeams((prev) => prev.filter((t) => !filtered.includes(t)));
                        } else {
                          setStaffFilterTeams([]);
                        }
                      }}
                    >
                      取消全選{teamSearch ? "（篩選結果）" : ""}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableTeams
                      .filter((team) => team.toLowerCase().includes(teamSearch.toLowerCase()))
                      .map((team) => (
                      <label key={team} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffFilterTeams.includes(team)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStaffFilterTeams((prev) => [...prev, team]);
                            } else {
                              setStaffFilterTeams((prev) => prev.filter((t) => t !== team));
                            }
                          }}
                        />
                        {team}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">載入團隊中...</p>
              )}
              {staffFilterTeams.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {staffFilterTeams.map((team) => (
                    <Badge key={team} variant="secondary" className="text-xs">
                      {team}
                      <button
                        type="button"
                        className="ml-1 hover:text-red-500"
                        onClick={() => setStaffFilterTeams((prev) => prev.filter((t) => t !== team))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline ml-1"
                    onClick={() => setStaffFilterTeams([])}
                  >
                    全部清除
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {staffFilterTeams.length === 0
                  ? "未篩選，公開報名表格會顯示所有在職同事"
                  : `已篩選 ${staffFilterTeams.length} 個團隊，只有該團隊的同事會出現在員工列表`}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">表格欄位</Label>
              {fields.map((field, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <Input
                      className="flex-1 bg-white border-slate-300"
                      value={field.label}
                      onChange={(e) => updateField(idx, "label", e.target.value)}
                      placeholder="欄位名稱"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => {
                        updateField(idx, "type", v);
                        if (v === "select" && !field.options) {
                          updateField(idx, "options", [""]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-36 bg-white border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(idx, "required", e.target.checked)}
                      />
                      必填
                    </label>
                    <Button variant="ghost" size="icon" onClick={() => removeField(idx)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                  {/* Options editor for select fields */}
                  {field.type === "select" && (
                    <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-1">
                      <p className="text-xs text-muted-foreground">下拉選項：</p>
                      {(field.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-1 items-center">
                          <Input
                            className="h-7 text-sm flex-1 bg-white border-slate-300"
                            value={opt}
                            onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                            placeholder={`選項 ${optIdx + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeOption(idx, optIdx)}
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-blue-600"
                        onClick={() => addOption(idx)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        新增選項
                      </Button>
                    </div>
                  )}
                  {/* Dynamic staff note */}
                  {field.type === "dynamic_staff" && (
                    <div className="ml-4 pl-3 border-l-2 border-green-200">
                      <p className="text-xs text-muted-foreground">
                        📋 此欄位會自動載入員工列表，報名者可搜尋並選擇
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                新增欄位
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => {
                setShowNewForm(false);
                cancelEdit();
              }}>
                取消
              </Button>
              <Button size="sm" onClick={editingForm ? updateForm : createForm}>
                {editingForm ? "儲存修改" : "建立表格"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
