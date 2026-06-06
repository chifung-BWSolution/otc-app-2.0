import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

export default function JoinEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffProfile, setStaffProfile] = useState(null);
  const [myRegistrations, setMyRegistrations] = useState([]);

  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchStaffProfile();
    fetchMyRegistrations();
  }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*, event_sections(id, name, sort_order, location, start_time, end_time)")
      .in("status", ["published"])
      .order("start_datetime", { ascending: true, nullsFirst: false });

    if (!error && data) {
      // Show events that haven't ended yet
      const now = new Date();
      const upcoming = data.filter((e) => {
        // Check sections first (for multi_section events)
        if (e.event_sections && e.event_sections.length > 0) {
          const sectionDates = e.event_sections
            .map((s) => s.end_time || s.start_time)
            .filter(Boolean);
          
          if (sectionDates.length > 0) {
            // Find the latest section date
            const latestEnd = sectionDates
              .map((d) => new Date(d).getTime())
              .filter((t) => !isNaN(t))
              .sort((a, b) => b - a)[0];
            
            if (latestEnd) {
              // Add 1 day buffer after the latest section end time
              return latestEnd + 24 * 60 * 60 * 1000 >= now.getTime();
            }
          }
          // Sections exist but no dates set — always show
          return true;
        }

        // If no section dates, use the main event dates
        if (!e.start_datetime && !e.end_datetime) {
          return true; // No dates at all, always show
        }
        // Use end_datetime if available
        if (e.end_datetime) {
          const endTime = new Date(e.end_datetime).getTime();
          if (isNaN(endTime)) return true;
          // Add 1 day buffer after end
          return endTime + 24 * 60 * 60 * 1000 >= now.getTime();
        }
        // Only start_datetime: add 1 day buffer
        if (e.start_datetime) {
          const startTime = new Date(e.start_datetime).getTime();
          if (isNaN(startTime)) return true;
          return startTime + 24 * 60 * 60 * 1000 >= now.getTime();
        }
        return true;
      });
      setEvents(upcoming);
    }
    setLoading(false);
  };

  const fetchStaffProfile = async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from("staff")
      .select("id, bubble_id, chinese_name, display_name, full_name, work_email, personal_email, department, o_position, o_team, phone")
      .or(`work_email.eq.${user.email},personal_email.eq.${user.email}`)
      .limit(1)
      .single();
    if (data) setStaffProfile(data);
  };

  const fetchMyRegistrations = async () => {
    if (!user?.email) return;
    // Fetch registrations that match current user's email in form_data
    const { data } = await supabase
      .from("event_registrations")
      .select("event_id, section_id")
      .or(`form_data->>email.eq.${user.email},form_data->>電郵.eq.${user.email}`);
    if (data) setMyRegistrations(data);
  };

  const isRegistered = (eventId, sectionId = null) => {
    return myRegistrations.some(
      (r) => r.event_id === eventId && (!sectionId || r.section_id === sectionId)
    );
  };

  const openRegisterDialog = async (event) => {
    setSelectedEvent(event);
    setSelectedSection("");
    setSelectedSections([]);

    if (event.registration_mode === "multi_section" && event.event_sections?.length > 0) {
      // Sort sections by sort_order
      const sorted = [...event.event_sections].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setSections(sorted);

      // Fetch section_selection_mode from the event's registration form
      const { data: formData } = await supabase
        .from("registration_forms")
        .select("section_selection_mode")
        .eq("event_id", event.id)
        .limit(1)
        .single();
      // Store section_selection_mode on the event object for convenience
      if (formData) {
        setSelectedEvent((prev) => ({ ...prev, section_selection_mode: formData.section_selection_mode || "single" }));
      }
    } else {
      setSections([]);
    }
  };

  const handleQuickRegister = async () => {
    if (!selectedEvent || !staffProfile) {
      toast({ title: "找不到您的員工資料，無法報名", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Build form_data from staff profile
    const formData = {
      name: staffProfile.chinese_name || staffProfile.display_name || staffProfile.full_name || "",
      email: staffProfile.work_email || staffProfile.personal_email || user.email || "",
      department: staffProfile.department || "",
      position: staffProfile.o_position || "",
      team: staffProfile.o_team || "",
      phone: staffProfile.phone || "",
    };

    try {
      if (selectedEvent.registration_mode === "multi_section" && sections.length > 0) {
        // Multi-section: check if user selected sections
        const sectionSelectionMode = selectedEvent.section_selection_mode || "single";
        
        if (sectionSelectionMode === "multi" && selectedSections.length > 0) {
          // Register for multiple sections
          for (const secId of selectedSections) {
            if (!isRegistered(selectedEvent.id, secId)) {
              await supabase.from("event_registrations").insert({
                event_id: selectedEvent.id,
                section_id: secId,
                form_data: formData,
                guest_count: 0,
                status: "confirmed",
                registration_status: "attending",
                registration_source: "staff_portal",
                registered_at: new Date().toISOString(),
              });
            }
          }
        } else if (selectedSection) {
          // Single section selection
          if (!isRegistered(selectedEvent.id, selectedSection)) {
            await supabase.from("event_registrations").insert({
              event_id: selectedEvent.id,
              section_id: selectedSection,
              form_data: formData,
              guest_count: 0,
              status: "confirmed",
              registration_status: "attending",
              registration_source: "staff_portal",
              registered_at: new Date().toISOString(),
            });
          }
        } else {
          toast({ title: "請選擇場次", variant: "destructive" });
          setSubmitting(false);
          return;
        }
      } else {
        // Single section event
        if (isRegistered(selectedEvent.id)) {
          toast({ title: "您已報名此活動", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        await supabase.from("event_registrations").insert({
          event_id: selectedEvent.id,
          form_data: formData,
          guest_count: 0,
          status: "confirmed",
          registration_status: "attending",
          registration_source: "staff_portal",
          registered_at: new Date().toISOString(),
        });
      }

      toast({ title: "報名成功！🎉" });
      setSelectedEvent(null);
      fetchMyRegistrations();
    } catch (err) {
      toast({ title: "報名失敗，請稍後再試", variant: "destructive" });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-bold">🎫 參加活動</h1>
        <Badge variant="secondary" className="text-xs">
          {events.length} 個即將舉行
        </Badge>
      </div>

      {staffProfile && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              👋 {staffProfile.chinese_name || staffProfile.display_name || staffProfile.full_name}，
              報名時會自動帶入您的部門、職位等資料。
            </p>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">暫無即將舉行的活動</p>
            <p className="text-sm">活動發佈後將會顯示在此處</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const alreadyRegistered = isRegistered(event.id);
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Cover image */}
                    {event.cover_image_url && (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{event.title}</h3>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {typeConfig[event.event_type] || event.event_type}
                        </Badge>
                        {event.registration_mode === "multi_section" && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            多場次
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                        {event.start_datetime && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDatetime(event.start_datetime)}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                        {event.max_capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            上限 {event.max_capacity} 人
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Show sections if multi_section */}
                      {event.registration_mode === "multi_section" && event.event_sections?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.event_sections
                            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map((sec) => (
                              <Badge key={sec.id} variant="outline" className="text-xs">
                                {sec.name}
                                {sec.start_time && ` · ${formatDatetime(sec.start_time)}`}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {alreadyRegistered ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          已報名
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openRegisterDialog(event)}
                        >
                          報名
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Registration Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認報名 - {selectedEvent?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Staff info preview */}
            {staffProfile && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">姓名：</span>{staffProfile.chinese_name || staffProfile.display_name || staffProfile.full_name}</p>
                <p><span className="text-muted-foreground">電郵：</span>{staffProfile.work_email || user?.email}</p>
                {staffProfile.department && <p><span className="text-muted-foreground">部門：</span>{staffProfile.department}</p>}
                {staffProfile.o_position && <p><span className="text-muted-foreground">職位：</span>{staffProfile.o_position}</p>}
                {staffProfile.o_team && <p><span className="text-muted-foreground">團隊：</span>{staffProfile.o_team}</p>}
                {staffProfile.phone && <p><span className="text-muted-foreground">電話：</span>{staffProfile.phone}</p>}
              </div>
            )}

            {/* Section selection for multi-section events */}
            {sections.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">請選擇場次：</p>
                {selectedEvent?.section_selection_mode === "multi" ? (
                  <div className="space-y-2">
                    {sections.map((sec) => {
                      const checked = selectedSections.includes(sec.id);
                      const alreadyReg = isRegistered(selectedEvent?.id, sec.id);
                      return (
                        <label
                          key={sec.id}
                          className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                            checked ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                          } ${alreadyReg ? "opacity-50" : ""}`}
                        >
                          <Checkbox
                            checked={checked || alreadyReg}
                            disabled={alreadyReg}
                            onCheckedChange={(val) => {
                              if (val) {
                                setSelectedSections([...selectedSections, sec.id]);
                              } else {
                                setSelectedSections(selectedSections.filter((id) => id !== sec.id));
                              }
                            }}
                          />
                          <span className="text-sm flex-1">
                            {sec.name}
                            {sec.start_time && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                {formatDatetime(sec.start_time)}
                              </span>
                            )}
                            {sec.location && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                📍 {sec.location}
                              </span>
                            )}
                          </span>
                          {alreadyReg && <Badge variant="secondary" className="text-xs">已報名</Badge>}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇場次" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.id} disabled={isRegistered(selectedEvent?.id, sec.id)}>
                          {sec.name}
                          {sec.start_time && ` · ${formatDatetime(sec.start_time)}`}
                          {isRegistered(selectedEvent?.id, sec.id) ? " (已報名)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              取消
            </Button>
            <Button onClick={handleQuickRegister} disabled={submitting}>
              {submitting ? "報名中..." : "確認報名"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
