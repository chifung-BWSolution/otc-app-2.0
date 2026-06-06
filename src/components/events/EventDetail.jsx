import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Link2, Copy, ExternalLink, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import EventFormModal from "./EventFormModal";
import SectionManager from "./SectionManager";
import FormBuilder from "./FormBuilder";
import RegistrationList from "./RegistrationList";
import SeatingBoard from "./SeatingBoard";
import NameBadgeGenerator from "./NameBadgeGenerator";
import RsvpTemplateManager from "./RsvpTemplateManager";
import MaterialManager from "./MaterialManager";

const statusConfig = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-700" },
  published: { label: "已發佈", color: "bg-green-100 text-green-700" },
  closed: { label: "已結束", color: "bg-red-100 text-red-700" },
  cancelled: { label: "已取消", color: "bg-yellow-100 text-yellow-700" },
};

const typeConfig = {
  seminar: "💬 研討會",
  workshop: "🔧 工作坊",
  dinner: "🍽️ 晚宴",
  meeting: "📋 會議",
  other: "🎪 其他",
};

// Format datetime string using UTC to avoid timezone shift
function formatDatetime(dtStr) {
  if (!dtStr) return "";
  const d = new Date(dtStr);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  return `${year}年${monthNames[month]}${day}日 ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export default function EventDetail({ eventId, onBack }) {
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [registrationForms, setRegistrationForms] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!error && data) {
      setEvent(data);
      // Fetch ALL registration forms for this event
      const { data: forms } = await supabase
        .from("registration_forms")
        .select("id, title, slug, is_active")
        .eq("event_id", eventId)
        .order("created_at");
      if (forms) {
        setRegistrationForms(forms);
      }
      // Fetch sections if multi_section
      if (data.registration_mode === "multi_section") {
        const { data: secs } = await supabase
          .from("event_sections")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order");
        if (secs) setSections(secs);
      }
    }
    setLoading(false);
  };

  const copyLink = (link) => {
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p>找不到活動</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          返回
        </Button>
      </div>
    );
  }

  const activeForm = registrationForms.find(f => f.is_active);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{event.title}</h1>
            <Badge className={statusConfig[event.status]?.color}>
              {statusConfig[event.status]?.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {event.location}
            {event.start_datetime && ` · ${formatDatetime(event.start_datetime)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {activeForm && event.registration_mode !== "multi_section" && (
            <Button variant="outline" size="sm" onClick={() => copyLink(`${window.location.origin}/register/${activeForm.slug}`)}>
              <Copy className="w-4 h-4 mr-1" />
              複製報名連結
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-1" />
            編輯
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">📋 概覽</TabsTrigger>
          <TabsTrigger value="registration">📝 報名設定</TabsTrigger>
          <TabsTrigger value="list">👥 報名清單</TabsTrigger>
          {event.requires_seating && (
            <TabsTrigger value="seating">🪑 座位安排</TabsTrigger>
          )}
          <TabsTrigger value="badges">🏷️ 名牌印刷</TabsTrigger>
          <TabsTrigger value="rsvp">📩 RSVP</TabsTrigger>
          <TabsTrigger value="materials">📦 物資</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6 space-y-5">
              {event.cover_image_url && (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">活動類型：</span>
                  <span className="font-medium">{typeConfig[event.event_type] || event.event_type}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">報名模式：</span>
                  <span className="font-medium">
                    {event.registration_mode === "multi_section" ? "多場次" : "單場次"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">名額上限：</span>
                  <span className="font-medium">{event.max_capacity || "不限"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">座位安排：</span>
                  <span className="font-medium">{event.requires_seating ? "是" : "否"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">允許重複報名：</span>
                  <span className="font-medium">{event.allow_duplicate_registration ? "是" : "否"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">狀態：</span>
                  <Badge className={statusConfig[event.status]?.color}>
                    {statusConfig[event.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* Location & Time - depends on mode */}
              {event.registration_mode !== "multi_section" ? (
                <>
                  {/* Single section: show event-level location & time */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">地點：</span>
                      <span className="font-medium">{event.location}</span>
                    </div>
                  )}
                  {(event.start_datetime || event.end_datetime) && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {event.start_datetime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">開始：</span>
                          <span className="font-medium">{formatDatetime(event.start_datetime)}</span>
                        </div>
                      )}
                      {event.end_datetime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">結束：</span>
                          <span className="font-medium">{formatDatetime(event.end_datetime)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Multi section: list each section's location & time */}
                  {sections.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">📂 各場次資訊</p>
                      <div className="border rounded-lg divide-y">
                        {sections.map((sec) => (
                          <div key={sec.id} className="p-3 text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sec.name}</span>
                              {sec.max_capacity && (
                                <Badge variant="outline" className="text-xs">
                                  名額 {sec.max_capacity}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-muted-foreground">
                              {sec.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{sec.location}</span>
                                </div>
                              )}
                              {(sec.start_time || sec.end_time) && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {sec.start_time ? formatDatetime(sec.start_time) : "—"}
                                    {" ~ "}
                                    {sec.end_time ? formatDatetime(sec.end_time) : "—"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1 font-medium">描述</p>
                  <p className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded-lg">{event.description}</p>
                </div>
              )}

              {/* Registration Links - show ALL forms */}
              {registrationForms.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> 報名連結
                  </p>
                  <div className="space-y-2">
                    {registrationForms.map((form) => {
                      const link = `${window.location.origin}/register/${form.slug}`;
                      return (
                        <div key={form.id} className="border border-blue-200 rounded-lg overflow-hidden">
                          <div className="bg-blue-50 px-4 py-2 flex items-center justify-between border-b border-blue-200">
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">{form.title}</span>
                            </div>
                            <Badge variant={form.is_active ? "default" : "secondary"} className="text-xs">
                              {form.is_active ? "啟用中" : "停用"}
                            </Badge>
                          </div>
                          <div className="p-3 flex items-center gap-3">
                            <span className="text-xs text-muted-foreground flex-1 break-all font-mono">
                              {link}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => copyLink(link)} className="shrink-0">
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              複製
                            </Button>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              預覽
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration">
          <div className="space-y-6">
            {event.registration_mode === "multi_section" && (
              <SectionManager eventId={eventId} />
            )}
            <FormBuilder eventId={eventId} onFormCreated={fetchEvent} />
          </div>
        </TabsContent>

        <TabsContent value="list">
          <RegistrationList eventId={eventId} />
        </TabsContent>

        {event.requires_seating && (
          <TabsContent value="seating">
            <SeatingBoard eventId={eventId} />
          </TabsContent>
        )}

        <TabsContent value="badges">
          <NameBadgeGenerator eventId={eventId} />
        </TabsContent>

        <TabsContent value="rsvp">
          <RsvpTemplateManager eventId={eventId} eventTitle={event.title} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialManager eventId={eventId} />
        </TabsContent>
      </Tabs>

      {showEditModal && (
        <EventFormModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            fetchEvent();
          }}
        />
      )}
    </div>
  );
}
