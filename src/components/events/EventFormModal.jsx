import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Image } from "lucide-react";

export default function EventFormModal({ event, onClose, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!event;

  // Helper: extract datetime-local value from TIMESTAMPTZ string
  // DB stores as UTC, so we use UTC parts to get original input value
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

  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "other",
    location: event?.location || "",
    cover_image_url: event?.cover_image_url || "",
    start_datetime: toLocalInput(event?.start_datetime),
    end_datetime: toLocalInput(event?.end_datetime),
    requires_seating: event?.requires_seating || false,
    registration_mode: event?.registration_mode || "single_section",
    max_capacity: event?.max_capacity || "",
    allow_duplicate_registration: event?.allow_duplicate_registration || false,
    status: event?.status || "draft",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(event?.cover_image_url || "");
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "請選擇圖片檔案", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "圖片大小不能超過 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("event-covers")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      handleChange("cover_image_url", publicUrl);
      toast({ title: "圖片上傳成功" });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "圖片上傳失敗", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    handleChange("cover_image_url", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "請輸入活動名稱", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      max_capacity: form.max_capacity ? parseInt(form.max_capacity) : null,
      start_datetime: form.registration_mode === "multi_section" ? null : (form.start_datetime ? form.start_datetime + ":00Z" : null),
      end_datetime: form.registration_mode === "multi_section" ? null : (form.end_datetime ? form.end_datetime + ":00Z" : null),
      updated_at: new Date().toISOString(),
    };

    if (!isEdit) {
      payload.created_by = user?.id || null;
    }

    let error;
    if (isEdit) {
      ({ error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id));
    } else {
      ({ error } = await supabase.from("events").insert(payload));
    }

    setSaving(false);

    if (error) {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEdit ? "活動已更新" : "活動已建立" });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯活動" : "建立活動"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>活動名稱 *</Label>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="輸入活動名稱"
            />
          </div>

          <div>
            <Label>活動類型</Label>
            <Select value={form.event_type} onValueChange={(v) => handleChange("event_type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seminar">💬 研討會</SelectItem>
                <SelectItem value="workshop">🔧 工作坊</SelectItem>
                <SelectItem value="dinner">🍽️ 晚宴</SelectItem>
                <SelectItem value="meeting">📋 會議</SelectItem>
                <SelectItem value="other">🎪 其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>描述</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="活動描述..."
              rows={3}
            />
          </div>

          {form.registration_mode !== "multi_section" && (
            <div>
              <Label>地點</Label>
              <Input
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="活動地點"
              />
              <p className="text-xs text-muted-foreground mt-1">
                單場次模式：於此設定地點
              </p>
            </div>
          )}
          {form.registration_mode === "multi_section" && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              📍 多場次模式：地點請於各場次中設定
            </p>
          )}

          <div>
            <Label>封面圖片</Label>
            <div className="mt-1.5">
              {previewUrl ? (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="封面預覽"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors ${uploading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">上傳中...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Upload size={28} />
                      <span className="text-sm font-medium">點擊上傳封面圖片</span>
                      <span className="text-xs">支援 JPG、PNG、GIF（最大 5MB）</span>
                    </div>
                  )}
                </label>
              )}
              {previewUrl && (
                <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 cursor-pointer hover:underline">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <Image size={12} />
                  更換圖片
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>開始日期時間</Label>
              <Input
                type="datetime-local"
                value={form.start_datetime}
                onChange={(e) => handleChange("start_datetime", e.target.value)}
                disabled={form.registration_mode === "multi_section"}
              />
            </div>
            <div>
              <Label>結束日期時間</Label>
              <Input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(e) => handleChange("end_datetime", e.target.value)}
                disabled={form.registration_mode === "multi_section"}
              />
            </div>
          </div>
          {form.registration_mode === "multi_section" && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              🕐 多場次模式：開始/結束時間請於各場次中設定
            </p>
          )}

          <div>
            <Label>報名模式</Label>
            <Select
              value={form.registration_mode}
              onValueChange={(v) => handleChange("registration_mode", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_section">單場次</SelectItem>
                <SelectItem value="multi_section">多場次</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>總名額上限（選填）</Label>
            <Input
              type="number"
              value={form.max_capacity}
              onChange={(e) => handleChange("max_capacity", e.target.value)}
              placeholder="不限"
            />
          </div>

          <div>
            <Label>活動狀態</Label>
            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="published">已發佈</SelectItem>
                <SelectItem value="closed">已結束</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>需要座位安排</Label>
            <Switch
              checked={form.requires_seating}
              onCheckedChange={(v) => handleChange("requires_seating", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>允許重複報名</Label>
            <Switch
              checked={form.allow_duplicate_registration}
              onCheckedChange={(v) => handleChange("allow_duplicate_registration", v)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "儲存中..." : isEdit ? "更新" : "建立"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
