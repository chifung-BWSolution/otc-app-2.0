import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SectionManager({ eventId }) {
  const { toast } = useToast();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState({ name: "", max_capacity: "", location: "", start_time: "", end_time: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", max_capacity: "", location: "", start_time: "", end_time: "" });

  useEffect(() => {
    fetchSections();
  }, [eventId]);

  const fetchSections = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_sections")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order");
    if (data) setSections(data);
    setLoading(false);
  };

  const addSection = async () => {
    if (!newSection.name.trim()) {
      toast({ title: "請輸入場次名稱", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("event_sections").insert({
      event_id: eventId,
      name: newSection.name,
      max_capacity: newSection.max_capacity ? parseInt(newSection.max_capacity) : null,
      location: newSection.location || null,
      start_time: newSection.start_time ? newSection.start_time + ":00Z" : null,
      end_time: newSection.end_time ? newSection.end_time + ":00Z" : null,
      sort_order: sections.length,
    });
    if (error) {
      toast({ title: "新增失敗", description: error.message, variant: "destructive" });
    } else {
      setNewSection({ name: "", max_capacity: "", location: "", start_time: "", end_time: "" });
      fetchSections();
      toast({ title: "場次已新增" });
    }
  };

  const startEdit = (section) => {
    setEditingId(section.id);
    // Use UTC to extract the original input value without timezone shift
    const toLocalInput = (dtStr) => {
      if (!dtStr) return "";
      const d = new Date(dtStr);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const h = String(d.getUTCHours()).padStart(2, "0");
      const min = String(d.getUTCMinutes()).padStart(2, "0");
      return `${y}-${m}-${day}T${h}:${min}`;
    };
    setEditForm({
      name: section.name,
      max_capacity: section.max_capacity?.toString() || "",
      location: section.location || "",
      start_time: toLocalInput(section.start_time),
      end_time: toLocalInput(section.end_time),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", max_capacity: "", location: "", start_time: "", end_time: "" });
  };

  const saveEdit = async (id) => {
    if (!editForm.name.trim()) {
      toast({ title: "請輸入場次名稱", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("event_sections")
      .update({
        name: editForm.name,
        max_capacity: editForm.max_capacity ? parseInt(editForm.max_capacity) : null,
        location: editForm.location || null,
        start_time: editForm.start_time ? editForm.start_time + ":00Z" : null,
        end_time: editForm.end_time ? editForm.end_time + ":00Z" : null,
      })
      .eq("id", id);
    if (error) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    } else {
      setEditingId(null);
      fetchSections();
      toast({ title: "場次已更新" });
    }
  };

  const deleteSection = async (id) => {
    if (!confirm("確定刪除此場次？")) return;
    await supabase.from("event_sections").delete().eq("id", id);
    fetchSections();
    toast({ title: "場次已刪除" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📂 場次管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">載入中...</p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">暫無場次，請新增</p>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                {editingId === section.id ? (
                  <>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="場次名稱"
                          className="h-8"
                        />
                        <Input
                          type="number"
                          value={editForm.max_capacity}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, max_capacity: e.target.value }))
                          }
                          placeholder="名額"
                          className="h-8 w-20"
                        />
                      </div>
                      <Input
                        value={editForm.location}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="地點"
                        className="h-8"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">開始時間</Label>
                          <Input
                            type="datetime-local"
                            value={editForm.start_time}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, start_time: e.target.value }))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">結束時間</Label>
                          <Input
                            type="datetime-local"
                            value={editForm.end_time}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, end_time: e.target.value }))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => saveEdit(section.id)}
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEdit}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{section.name}</p>
                      <p className="text-xs text-muted-foreground">
                        名額：{section.max_capacity || "不限"}
                        {section.location && ` ｜ 📍 ${section.location}`}
                      </p>
                      {(section.start_time || section.end_time) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          🕐 {section.start_time ? (() => { const d = new Date(section.start_time); return `${d.getUTCMonth()+1}月${d.getUTCDate()}日 ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`; })() : "—"}
                          {" ~ "}
                          {section.end_time ? (() => { const d = new Date(section.end_time); return `${d.getUTCMonth()+1}月${d.getUTCDate()}日 ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`; })() : "—"}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(section)}
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t pt-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">場次名稱</Label>
              <Input
                value={newSection.name}
                onChange={(e) =>
                  setNewSection((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="例如：上午場"
              />
            </div>
            <div className="w-24">
              <Label className="text-xs">名額</Label>
              <Input
                type="number"
                value={newSection.max_capacity}
                onChange={(e) =>
                  setNewSection((prev) => ({ ...prev, max_capacity: e.target.value }))
                }
                placeholder="不限"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">地點</Label>
            <Input
              value={newSection.location}
              onChange={(e) =>
                setNewSection((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="場次地點"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">開始時間</Label>
              <Input
                type="datetime-local"
                value={newSection.start_time}
                onChange={(e) =>
                  setNewSection((prev) => ({ ...prev, start_time: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">結束時間</Label>
              <Input
                type="datetime-local"
                value={newSection.end_time}
                onChange={(e) =>
                  setNewSection((prev) => ({ ...prev, end_time: e.target.value }))
                }
              />
            </div>
          </div>
          <Button onClick={addSection} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            新增場次
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
