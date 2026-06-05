import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, MapPin, Users, Clock, Link2 } from "lucide-react";
import EventFormModal from "@/components/events/EventFormModal";
import EventDetail from "@/components/events/EventDetail";

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

export default function EventManagement() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*, event_sections(count), event_registrations(count)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedEvent) {
    return (
      <EventDetail
        eventId={selectedEvent}
        onBack={() => {
          setSelectedEvent(null);
          fetchEvents();
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎪 活動管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            建立及管理公司活動、報名、出席及座位安排
          </p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          建立活動
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜尋活動名稱或地點..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">🎪</p>
          <p>暫無活動</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowCreateModal(true)}>
            建立第一個活動
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedEvent(event.id)}
            >
              {event.cover_image_url && (
                <div className="h-36 overflow-hidden rounded-t-lg">
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">
                    {typeConfig[event.event_type] || "🎪"} {event.title}
                  </CardTitle>
                  <Badge className={statusConfig[event.status]?.color || "bg-gray-100"}>
                    {statusConfig[event.status]?.label || event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {event.start_datetime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {(() => { const d = new Date(event.start_datetime); return `${d.getUTCFullYear()}/${d.getUTCMonth()+1}/${d.getUTCDate()}`; })()}
                      {event.end_datetime && (
                        <> ~ {(() => { const d = new Date(event.end_datetime); return `${d.getUTCMonth()+1}/${d.getUTCDate()}`; })()}</>
                      )}
                    </span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {event.event_registrations?.[0]?.count || 0} 人報名
                    {event.max_capacity ? ` / ${event.max_capacity} 名額` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-muted px-1.5 py-0.5 rounded">
                    {event.registration_mode === "multi_section" ? "多場次" : "單場次"}
                  </span>
                  {event.event_sections?.[0]?.count > 0 && (
                    <span className="bg-muted px-1.5 py-0.5 rounded">
                      {event.event_sections[0].count} 場次
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
