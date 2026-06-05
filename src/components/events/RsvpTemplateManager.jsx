import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TEMPLATE_TYPES = [
  { value: "submission_success", label: "報名成功確認", emoji: "✅" },
  { value: "reminder", label: "活動前提醒", emoji: "⏰" },
  { value: "attendance_confirmed", label: "出席確認", emoji: "🎉" },
  { value: "cancellation", label: "缺席/取消報名", emoji: "❌" },
];

const VARIABLES = [
  { key: "活動名稱", desc: "活動標題" },
  { key: "參加者姓名", desc: "報名者姓名" },
  { key: "日期", desc: "活動日期" },
  { key: "地點", desc: "活動地點" },
  { key: "場次名稱", desc: "所選場次名稱" },
];

// Replace {{variable}} with styled badge for preview
function renderPreview(body) {
  if (!body) return null;
  const parts = body.split(/({{[^}]+}})/g);
  return parts.map((part, i) => {
    const match = part.match(/^{{(.+)}}$/);
    if (match) {
      return (
        <span key={i} className="inline-flex items-center bg-pink-100 text-pink-700 text-xs px-1.5 py-0.5 rounded font-medium mx-0.5">
          @{match[1]}
        </span>
      );
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function VariableTextarea({ value, onChange, placeholder, rows = 5 }) {
  const textareaRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [atIndex, setAtIndex] = useState(-1);
  const [filterText, setFilterText] = useState("");
  const dropdownRef = useRef(null);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setAtIndex(lastAtIndex);
        setFilterText(textAfterAt);
        setShowDropdown(true);
        const linesBefore = textBeforeCursor.split("\n");
        const currentLineIndex = linesBefore.length - 1;
        const lineHeight = 20;
        setDropdownPos({
          top: (currentLineIndex + 1) * lineHeight + 4,
          left: Math.min((linesBefore[currentLineIndex]?.length || 0) * 7, 200),
        });
        return;
      }
    }
    setShowDropdown(false);
  };

  const insertVariable = (variable) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = value.substring(0, atIndex);
    const textAfter = value.substring(cursorPos);
    const insertedText = `{{${variable.key}}}`;
    const newValue = textBefore + insertedText + textAfter;
    onChange(newValue);
    setShowDropdown(false);

    setTimeout(() => {
      const newCursorPos = atIndex + insertedText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showDropdown && e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVars = VARIABLES.filter(
    (v) => v.key.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
      />
      {showDropdown && filteredVars.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-h-[200px] overflow-y-auto"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {filteredVars.map((v) => (
            <button
              key={v.key}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
              onClick={() => insertVariable(v)}
            >
              <span className="bg-pink-100 text-pink-700 text-xs px-1.5 py-0.5 rounded font-medium">
                @{v.key}
              </span>
              <span className="text-xs text-muted-foreground">{v.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RsvpTemplateManager({ eventId, eventTitle }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const DEFAULT_BODY = "你好 {{參加者姓名}}，\n\n感謝你報名參加「{{活動名稱}}」！\n\n活動日期：{{日期}}\n活動地點：{{地點}}\n場次：{{場次名稱}}\n\n如有任何查詢，歡迎聯絡我們。";

  const [form, setForm] = useState({
    template_type: "submission_success",
    body: DEFAULT_BODY,
    send_via_notification: true,
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, [eventId]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_rsvp_templates")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at");
    if (data) setTemplates(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      template_type: "submission_success",
      body: DEFAULT_BODY,
      send_via_notification: true,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
      template_type: t.template_type,
      body: t.body,
      send_via_notification: t.send_via_notification,
      is_active: t.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.body.trim()) {
      toast({ title: "請輸入訊息內容", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      event_id: eventId,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("event_rsvp_templates")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("event_rsvp_templates").insert(payload));
    }

    if (error) {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "模板已更新" : "模板已建立" });
      resetForm();
      fetchTemplates();
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm("確定刪除此訊息模板？")) return;
    await supabase.from("event_rsvp_templates").delete().eq("id", id);
    fetchTemplates();
    toast({ title: "模板已刪除" });
  };

  const toggleActive = async (id, current) => {
    await supabase
      .from("event_rsvp_templates")
      .update({ is_active: !current })
      .eq("id", id);
    fetchTemplates();
  };

  const getTypeConfig = (type) => TEMPLATE_TYPES.find((t) => t.value === type) || { label: type, emoji: "📨" };

  const getUsedVariables = (body) => {
    const matches = body.match(/{{([^}]+)}}/g) || [];
    return matches.map((m) => m.replace(/[{}]/g, ""));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">📩 RSVP 訊息模板</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              新增模板
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form */}
          {showForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              {/* Type selector */}
              <div>
                <Label className="text-xs">訊息類型</Label>
                <Select
                  value={form.template_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, template_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Variable insertion section */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Label className="text-xs shrink-0">插入動態欄位：</Label>
                  <div className="flex flex-wrap gap-1">
                    {VARIABLES.map((v) => (
                      <Badge
                        key={v.key}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-pink-50 border-pink-200 text-pink-700"
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            body: p.body + `{{${v.key}}}`,
                          }));
                        }}
                      >
                        @ {v.key}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Used variables display */}
                {getUsedVariables(form.body).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">已使用動態欄位：</span>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(getUsedVariables(form.body))].map((v) => (
                        <Badge key={v} className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                          @{v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Textarea with @ autocomplete */}
              <div>
                <Label className="text-xs">訊息內容 *</Label>
                <VariableTextarea
                  value={form.body}
                  onChange={(val) => setForm((p) => ({ ...p, body: val }))}
                  placeholder={"輸入訊息內容..."}
                  rows={6}
                />
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  {"💡 使用 {{欄位名}} 嚟插入動態內容，例如 {{日期}} 會顯示活動日期"}
                </p>
              </div>

              {/* Notification toggle */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.send_via_notification}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, send_via_notification: v }))}
                  />
                  <Label className="text-xs flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" /> 系統通知
                  </Label>
                </div>
              </div>

              {/* Preview section */}
              {form.body.trim() && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">預覽效果</Label>
                  <div className="border rounded-lg p-4 bg-white space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">📩</span>
                      <span className="text-sm font-semibold">訊息預覽</span>
                    </div>
                    <div className="text-sm leading-relaxed">
                      {renderPreview(form.body)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  取消
                </Button>
                <Button size="sm" onClick={handleSave}>
                  {editingId ? "更新" : "建立"}
                </Button>
              </div>
            </div>
          )}

          {/* Existing templates list */}
          {loading ? (
            <p className="text-sm text-muted-foreground">載入中...</p>
          ) : templates.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              尚未建立 RSVP 訊息模板
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => {
                const typeConf = getTypeConfig(t.template_type);
                return (
                  <div key={t.id} className="border rounded-lg overflow-hidden">
                    {/* Template header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                      <div className="flex items-center gap-2">
                        <span>{typeConf.emoji}</span>
                        <span className="text-sm font-medium">{typeConf.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={t.is_active ? "default" : "secondary"}
                          className="text-xs cursor-pointer"
                          onClick={() => toggleActive(t.id, t.is_active)}
                        >
                          {t.is_active ? "啟用" : "停用"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(t)}>
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTemplate(t.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Template preview */}
                    <div className="p-4 space-y-2">
                      <div className="text-sm leading-relaxed">
                        {renderPreview(t.body)}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t">
                        {t.send_via_notification && (
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" /> 系統通知
                          </span>
                        )}
                      </div>
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
