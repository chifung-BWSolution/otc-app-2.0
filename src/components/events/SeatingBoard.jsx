import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Plus, Minus, Users, X, Filter, Link2, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

export default function SeatingBoard({ eventId }) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [seating, setSeating] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableCount, setTableCount] = useState(10);
  const [seatsPerTable, setSeatsPerTable] = useState(8);
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [dragSource, setDragSource] = useState(null); // 'unassigned' | 'table'
  const [groupAssign, setGroupAssign] = useState(true); // group companions together
  const [filterField, setFilterField] = useState("all"); // filter: all | inviter
  const [filterValue, setFilterValue] = useState("");
  const [staffMap, setStaffMap] = useState({});
  const [seatSearchOpen, setSeatSearchOpen] = useState(null); // { tableNum, seatNum } or null
  const [seatSearchQuery, setSeatSearchQuery] = useState("");
  const seatSearchInputRef = useRef(null);
  const [formFields, setFormFields] = useState([]); // all form fields from registration_forms

  useEffect(() => {
    fetchSections();
    fetchStaffMap();
    fetchFormFields();
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [eventId, selectedSectionId]);

  const fetchStaffMap = async () => {
    const map = {};
    // Try staff table
    const { data } = await supabase
      .from("staff")
      .select("id, bubble_id, chinese_name, display_name, full_name, work_email");
    if (data) {
      data.forEach((s) => {
        const name = s.chinese_name || s.display_name || s.full_name || s.id;
        if (s.id) map[String(s.id).trim()] = name;
        if (s.bubble_id) map[String(s.bubble_id).trim()] = name;
        if (s.work_email) map[s.work_email.toLowerCase().trim()] = name;
      });
    }
    // Also try publicStaffList edge function
    try {
      const res = await supabase.functions.invoke("publicStaffList");
      let staffList = [];
      if (res.data) {
        let parsed = res.data;
        if (typeof parsed === "string") {
          try { parsed = JSON.parse(parsed); } catch (_) { /* ignore */ }
        }
        if (Array.isArray(parsed)) staffList = parsed;
        else if (parsed?.data && Array.isArray(parsed.data)) staffList = parsed.data;
      }
      staffList.forEach((s) => {
        const name = s.name_zh || s.name_en || s.id;
        if (s.id) map[String(s.id).trim()] = name;
      });
    } catch (e) {
      console.warn("publicStaffList fallback failed:", e);
    }
    setStaffMap(map);
  };

  const fetchFormFields = async () => {
    const { data } = await supabase
      .from("registration_forms")
      .select("fields_config")
      .eq("event_id", eventId);
    if (data) {
      // Collect unique fields from all forms
      const seen = new Set();
      const allFields = [];
      data.forEach((form) => {
        (form.fields_config || []).forEach((f) => {
          if (!seen.has(f.key)) {
            seen.add(f.key);
            allFields.push(f);
          }
        });
      });
      setFormFields(allFields);
    }
  };

  const fetchSections = async () => {
    const { data } = await supabase
      .from("event_sections")
      .select("id, name")
      .eq("event_id", eventId)
      .order("sort_order");
    if (data) setSections(data);
  };

  const fetchData = async () => {
    setLoading(true);
    let regsQuery = supabase
      .from("event_registrations")
      .select("*, event_sections(name)")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .order("registered_at");

    if (selectedSectionId && selectedSectionId !== "all") {
      regsQuery = regsQuery.eq("section_id", selectedSectionId);
    }

    const { data: regs } = await regsQuery;

    // Fetch seating for this section (or all)
    let seatsQuery = supabase
      .from("seating_arrangements")
      .select("*")
      .eq("event_id", eventId);

    if (selectedSectionId && selectedSectionId !== "all") {
      seatsQuery = seatsQuery.eq("section_id", selectedSectionId);
    }

    const { data: seats } = await seatsQuery;

    if (regs) setRegistrations(regs);
    if (seats) {
      const map = {};
      seats.forEach((s) => {
        const seatKey = `${s.registration_id}__${s.guest_index || 0}`;
        map[seatKey] = s;
      });
      setSeating(map);
    } else {
      setSeating({});
    }
    setLoading(false);
  };

  // Merge registrations by person (same email), expand companions as separate seat entries
  const getPersonKey = (reg) => {
    const email = reg.form_data?.email || reg.form_data?.電郵 || "";
    const name = reg.form_data?.name || reg.form_data?.姓名 || "";
    if (email) return email.toLowerCase();
    if (name) return `name:${name}`;
    return `id:${reg.id}`;
  };

  const personGroups = (() => {
    const groupMap = new Map();
    registrations.forEach((reg) => {
      const key = getPersonKey(reg);
      if (!groupMap.has(key)) {
        groupMap.set(key, { key, registrations: [], name: "" });
      }
      const group = groupMap.get(key);
      group.registrations.push(reg);
      if (!group.name) {
        group.name = reg.form_data?.name || reg.form_data?.姓名 || "—";
      }
    });
    return Array.from(groupMap.values());
  })();

  // Build seat entries: each registrant + their companions each occupy one seat
  const seatEntries = (() => {
    const entries = [];
    personGroups.forEach((g) => {
      const first = g.registrations[0];
      const guestCount = first.guest_count || 0;
      const guestNamesList = first.guest_names || [];
      // Main registrant
      entries.push({
        key: g.key,
        name: g.name,
        isCompanion: false,
        companionOf: null,
        registrations: g.registrations,
        repId: first.id,
        guestIndex: 0,
        seatKey: `${first.id}__0`,
      });
      // Companions
      for (let i = 0; i < guestCount; i++) {
        entries.push({
          key: `${g.key}__guest_${i}`,
          name: guestNamesList[i] || `同行者 ${i + 1}`,
          isCompanion: true,
          companionOf: g.name,
          registrations: g.registrations,
          repId: first.id,
          guestIndex: i + 1,
          seatKey: `${first.id}__${i + 1}`,
        });
      }
    });
    return entries;
  })();

  // For seating, use seatEntries (registrant + companions)
  const personList = seatEntries;

  // A person/companion is "assigned" if their seatKey has a seat in the map
  const isPersonAssigned = (person) => !!seating[person.seatKey];
  const getPersonSeat = (person) => {
    if (seating[person.seatKey]) return { ...seating[person.seatKey], registrationId: person.repId };
    return null;
  };

  const assignSeat = (person, tableNumber, seatNumber) => {
    const regId = person.repId;
    const guestIndex = person.guestIndex;
    const seatKey = person.seatKey;
    const sectionId = selectedSectionId !== "all" ? selectedSectionId : null;
    const existing = seating[seatKey];

    // Fire DB call (non-blocking)
    if (existing?.id) {
      supabase
        .from("seating_arrangements")
        .update({
          table_number: tableNumber,
          seat_number: seatNumber,
          section_id: sectionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .then(() => {});
    } else {
      supabase.from("seating_arrangements").insert({
        event_id: eventId,
        registration_id: regId,
        guest_index: guestIndex,
        section_id: sectionId,
        table_number: tableNumber,
        seat_number: seatNumber,
      }).then(() => {});
    }

    // Update local state immediately using functional updater to avoid stale state
    setSeating((prev) => ({
      ...prev,
      [seatKey]: {
        ...(prev[seatKey] || {}),
        registration_id: regId,
        guest_index: guestIndex,
        table_number: tableNumber,
        seat_number: seatNumber,
      },
    }));
  };

  const removeSeat = async (person) => {
    const seatKey = person.seatKey;
    if (seating[seatKey]?.id) {
      await supabase.from("seating_arrangements").delete().eq("id", seating[seatKey].id);
    }
    setSeating((prev) => {
      const next = { ...prev };
      delete next[seatKey];
      return next;
    });
  };

  const handleDragStart = (e, person, source) => {
    setDraggedPerson(person);
    setDragSource(source);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", person.key);
  };

  const handleDrop = (e, tableNumber, seatNumber) => {
    e.preventDefault();
    if (!draggedPerson) return;

    // Check if seat is already occupied by a different person
    const occupantPerson = personList.find((p) => {
      const seat = getPersonSeat(p);
      return seat && seat.table_number === String(tableNumber) && seat.seat_number === String(seatNumber) && p.key !== draggedPerson.key;
    });

    if (occupantPerson) {
      toast({ title: "此座位已有人", variant: "destructive" });
      setDraggedPerson(null);
      setDragSource(null);
      return;
    }

    assignSeat(draggedPerson, String(tableNumber), String(seatNumber));

    // Group assign: move companions together (both for first assignment and table-to-table moves)
    if (groupAssign) {
      // Find all group members (same repId) that should move together
      let groupMembers = [];
      if (!draggedPerson.isCompanion) {
        // Dragging the main registrant: move all their companions
        groupMembers = personList.filter(
          (p) => p.isCompanion && p.repId === draggedPerson.repId && p.key !== draggedPerson.key
        );
      } else {
        // Dragging a companion: move the main registrant + all other companions
        groupMembers = personList.filter(
          (p) => p.repId === draggedPerson.repId && p.key !== draggedPerson.key
        );
      }

      if (groupMembers.length > 0) {
        let nextSeat = parseInt(seatNumber);
        const occupiedSeats = new Set();
        // Mark currently occupied seats at this table (excluding the group members being moved)
        const groupKeys = new Set([draggedPerson.key, ...groupMembers.map(m => m.key)]);
        personList.forEach((p) => {
          const seat = getPersonSeat(p);
          if (seat && seat.table_number === String(tableNumber) && !groupKeys.has(p.key)) {
            occupiedSeats.add(String(seat.seat_number));
          }
        });
        // Also mark the seat we just assigned
        occupiedSeats.add(String(seatNumber));

        groupMembers.forEach((comp) => {
          nextSeat++;
          while (nextSeat <= seatsPerTable && occupiedSeats.has(String(nextSeat))) {
            nextSeat++;
          }
          if (nextSeat <= seatsPerTable) {
            assignSeat(comp, String(tableNumber), String(nextSeat));
            occupiedSeats.add(String(nextSeat));
          }
        });
      }
    }

    toast({ title: "座位已分配" });
    setDraggedPerson(null);
    setDragSource(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Drop on unassigned area to remove from table
  const handleDropOnUnassigned = (e) => {
    e.preventDefault();
    if (!draggedPerson || dragSource === "unassigned") return;

    // Group remove: also remove companions/group members
    if (groupAssign) {
      const groupMembers = personList.filter(
        (p) => p.repId === draggedPerson.repId && p.key !== draggedPerson.key && isPersonAssigned(p)
      );
      groupMembers.forEach((comp) => removeSeat(comp));
    }

    removeSeat(draggedPerson);
    toast({ title: "已取消座位分配" });
    setDraggedPerson(null);
    setDragSource(null);
  };

  // Handle click on empty seat to open search popover
  const handleEmptySeatClick = (tableNum, seatNum) => {
    setSeatSearchOpen({ tableNum, seatNum });
    setSeatSearchQuery("");
    setTimeout(() => seatSearchInputRef.current?.focus(), 100);
  };

  // Assign person from search to the clicked empty seat
  const handleSearchAssign = (person) => {
    if (!seatSearchOpen) return;
    const { tableNum, seatNum } = seatSearchOpen;

    assignSeat(person, String(tableNum), String(seatNum));

    // Group assign companions
    if (groupAssign) {
      let groupMembers = [];
      if (!person.isCompanion) {
        groupMembers = personList.filter(
          (p) => p.isCompanion && p.repId === person.repId && p.key !== person.key
        );
      } else {
        groupMembers = personList.filter(
          (p) => p.repId === person.repId && p.key !== person.key
        );
      }

      if (groupMembers.length > 0) {
        let nextSeat = parseInt(seatNum);
        const occupiedSeats = new Set();
        const groupKeys = new Set([person.key, ...groupMembers.map(m => m.key)]);
        personList.forEach((p) => {
          const seat = getPersonSeat(p);
          if (seat && seat.table_number === String(tableNum) && !groupKeys.has(p.key)) {
            occupiedSeats.add(String(seat.seat_number));
          }
        });
        occupiedSeats.add(String(seatNum));

        groupMembers.forEach((comp) => {
          nextSeat++;
          while (nextSeat <= seatsPerTable && occupiedSeats.has(String(nextSeat))) {
            nextSeat++;
          }
          if (nextSeat <= seatsPerTable) {
            assignSeat(comp, String(tableNum), String(nextSeat));
            occupiedSeats.add(String(nextSeat));
          }
        });
      }
    }

    toast({ title: "座位已分配" });
    setSeatSearchOpen(null);
    setSeatSearchQuery("");
  };

  // Filter unassigned for seat search
  const seatSearchResults = (() => {
    if (!seatSearchOpen) return [];
    const query = seatSearchQuery.toLowerCase().trim();
    const unassignedPersons = personList.filter((p) => !isPersonAssigned(p));
    if (!query) return unassignedPersons.slice(0, 20);
    return unassignedPersons.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.companionOf && p.companionOf.toLowerCase().includes(query)) ||
      (p.registrations[0]?.form_data?.email || p.registrations[0]?.form_data?.電郵 || "").toLowerCase().includes(query) ||
      (p.registrations[0]?.form_data?.phone || p.registrations[0]?.form_data?.電話 || "").includes(query)
    ).slice(0, 20);
  })();

  const exportCSV = () => {
    const header = ["姓名", "身份", "所屬報名人", "電郵", "桌號", "座位號"];
    const rows = personList.map((p) => {
      const seat = getPersonSeat(p);
      return [
        p.name,
        p.isCompanion ? "同行人" : "報名人",
        p.isCompanion ? p.companionOf : "",
        p.registrations[0].form_data?.email || p.registrations[0].form_data?.電郵 || "",
        seat?.table_number || "",
        seat?.seat_number || "",
      ];
    });
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seating_${eventId}${selectedSectionId !== "all" ? `_section` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已匯出座位表" });
  };

  // Get unassigned / assigned persons
  const unassigned = personList.filter((p) => !isPersonAssigned(p));
  const assigned = personList.filter((p) => isPersonAssigned(p));

  // Filter unassigned by selected field
  const filteredUnassigned = unassigned.filter((p) => {
    if (filterField === "all" || !filterValue) return true;
    const reg = p.registrations[0];
    if (filterField === "inviter") {
      const inviter = reg.invited_by_staff_id || "";
      return String(inviter) === filterValue;
    }
    // Filter by form field
    const fieldVal = String(reg?.form_data?.[filterField] || "").trim();
    return fieldVal === filterValue;
  });

  // Get unique values for the currently selected filter field (from form fields)
  const uniqueFieldValues = (() => {
    if (filterField === "all" || filterField === "inviter") return [];
    const valSet = new Set();
    unassigned.forEach((p) => {
      const reg = p.registrations[0];
      const val = String(reg?.form_data?.[filterField] || "").trim();
      if (val) valSet.add(val);
    });
    return [...valSet].sort();
  })();

  // Get unique inviters for quick filter
  const uniqueInviters = [...new Set(unassigned.map((p) => {
    const reg = p.registrations[0];
    return reg.invited_by_staff_id || "";
  }).filter(Boolean))];

  // Helper to get inviter display name
  const getInviterName = (inviterId) => {
    const id = String(inviterId).trim();
    return staffMap[id] || staffMap[id.toLowerCase()] || id;
  };

  // Build a color map for companion groups at the same table
  const companionGroupColors = (() => {
    const colors = [
      "border-purple-400 bg-purple-50",
      "border-orange-400 bg-orange-50",
      "border-pink-400 bg-pink-50",
      "border-cyan-400 bg-cyan-50",
      "border-yellow-400 bg-yellow-50",
      "border-indigo-400 bg-indigo-50",
      "border-rose-400 bg-rose-50",
      "border-teal-400 bg-teal-50",
    ];
    const groupColorMap = {}; // key: `${tableNum}__${repId}` -> color class
    let colorIdx = 0;
    // For each table, find groups that have >1 person seated at that table
    for (let i = 0; i < tableCount; i++) {
      const tableNum = String(i + 1);
      const groupCount = {}; // repId -> count of people at this table
      personList.forEach((p) => {
        const seat = getPersonSeat(p);
        if (seat && seat.table_number === tableNum) {
          groupCount[p.repId] = (groupCount[p.repId] || 0) + 1;
        }
      });
      // Assign colors to groups with more than 1 person
      Object.entries(groupCount).forEach(([repId, count]) => {
        if (count > 1) {
          groupColorMap[`${tableNum}__${repId}`] = colors[colorIdx % colors.length];
          colorIdx++;
        }
      });
    }
    return groupColorMap;
  })();

  // Helper: get companion group color for a person at a table
  const getGroupColor = (person, tableNum) => {
    return companionGroupColors[`${tableNum}__${person.repId}`] || "";
  };

  // Build tables
  const tables = Array.from({ length: tableCount }, (_, i) => {
    const tableNum = String(i + 1);
    const seats = Array.from({ length: seatsPerTable }, (_, j) => {
      const seatNum = String(j + 1);
      const occupantPerson = personList.find((p) => {
        const seat = getPersonSeat(p);
        return seat && seat.table_number === tableNum && seat.seat_number === seatNum;
      });
      return { seatNum, occupantPerson };
    });
    return { tableNum, seats };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">🪑 座位安排（拖放模式）</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" />
          匯出座位表
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section filter */}
        {sections.length > 0 && (
          <div className="flex items-center gap-3">
            <Label className="text-xs shrink-0">選擇場次：</Label>
            <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <SelectValue placeholder="全部場次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部場次</SelectItem>
                {sections.map((sec, idx) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    #{idx + 1} {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              （不同場次可有不同座位安排）
            </span>
          </div>
        )}

        {/* Settings */}
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <Label className="text-xs">桌數</Label>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setTableCount(Math.max(1, tableCount - 1))}>
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                className="w-16 h-8 text-center"
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setTableCount(tableCount + 1)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">每桌座位</Label>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setSeatsPerTable(Math.max(1, seatsPerTable - 1))}>
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                className="w-16 h-8 text-center"
                value={seatsPerTable}
                onChange={(e) => setSeatsPerTable(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setSeatsPerTable(seatsPerTable + 1)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span>已分配: {assigned.length}/{personList.length} 人</span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">載入中...</p>
        ) : personList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暫無報名記錄</p>
        ) : (
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Unassigned guests (drag source & drop target for removing) */}
            <div className="lg:w-72 shrink-0">
              <div
                className="border rounded-lg p-3"
                onDrop={handleDropOnUnassigned}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">未分配座位 ({unassigned.length})</span>
                </div>

                {/* Group assign toggle */}
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupAssign}
                      onChange={(e) => setGroupAssign(e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    同行人一齊分配
                  </label>
                </div>

                {/* Filter controls */}
                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={filterField} onValueChange={(v) => { setFilterField(v); setFilterValue(""); }}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="inviter">按邀請人</SelectItem>
                        {formFields.map((f) => (
                          <SelectItem key={f.key} value={f.key}>按{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {filterField === "inviter" && uniqueInviters.length > 0 && (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="選擇邀請人" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueInviters.map((inv) => (
                          <SelectItem key={inv} value={inv}>{getInviterName(inv)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {filterField !== "all" && filterField !== "inviter" && uniqueFieldValues.length > 0 && (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={`選擇${formFields.find(f => f.key === filterField)?.label || filterField}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueFieldValues.map((val) => (
                          <SelectItem key={val} value={val}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {filteredUnassigned.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {unassigned.length === 0 ? "全部已分配 ✓" : "無符合篩選條件"}
                    </p>
                  ) : (
                    filteredUnassigned.map((person) => (
                      <div
                        key={person.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, person, "unassigned")}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-blue-100 transition-colors text-xs ${
                          person.isCompanion ? "bg-purple-50 border border-purple-200" : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <span className="font-medium truncate">{person.name}</span>
                        {person.isCompanion && (
                          <span className="text-[10px] text-purple-500 shrink-0">({person.companionOf}的同行人)</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {dragSource && dragSource !== "unassigned" && (
                  <div className="mt-2 border-2 border-dashed border-orange-300 rounded p-2 text-center text-xs text-orange-600 bg-orange-50">
                    拖放到此處取消座位
                  </div>
                )}
              </div>
            </div>

            {/* Seating plan grid */}
            <div className="flex-1 overflow-x-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div key={table.tableNum} className="border rounded-lg p-3">
                    <div className="text-center mb-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        桌 {table.tableNum}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {table.seats.map((seat) => {
                        const groupColor = seat.occupantPerson ? getGroupColor(seat.occupantPerson, table.tableNum) : "";
                        const isInGroup = !!groupColor;
                        return (
                        <TooltipProvider key={seat.seatNum}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                onDrop={(e) => handleDrop(e, table.tableNum, seat.seatNum)}
                                onDragOver={handleDragOver}
                                draggable={!!seat.occupantPerson}
                                onDragStart={(e) => {
                                  if (seat.occupantPerson) {
                                    handleDragStart(e, seat.occupantPerson, "table");
                                  }
                                }}
                                className={`relative min-h-[36px] rounded border-2 text-xs flex items-center justify-center px-1 transition-colors ${
                                  seat.occupantPerson
                                    ? (groupColor || "bg-green-50 border-green-300") + " cursor-grab active:cursor-grabbing"
                                    : "bg-gray-50 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                                }`}
                                onClick={() => {
                                  if (!seat.occupantPerson) {
                                    handleEmptySeatClick(table.tableNum, seat.seatNum);
                                  }
                                }}
                              >
                                {seat.occupantPerson ? (
                                  <div className="flex items-center gap-0.5 w-full">
                                    {isInGroup && <Link2 className="w-2.5 h-2.5 shrink-0 text-purple-500" />}
                                    <span className="truncate font-medium text-[10px] flex-1">
                                      {seat.occupantPerson.name}
                                    </span>
                                    <button
                                      onClick={() => removeSeat(seat.occupantPerson)}
                                      className="shrink-0 text-red-400 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Search className="w-2.5 h-2.5" />
                                    {seat.seatNum}
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            {seat.occupantPerson && isInGroup && (
                              <TooltipContent side="top" className="text-xs max-w-[200px]">
                                <p className="font-medium">{seat.occupantPerson.isCompanion ? `${seat.occupantPerson.companionOf} 的同行人` : "報名人"}</p>
                                <p className="text-muted-foreground mt-0.5">
                                  同組成員：{personList.filter(p => p.repId === seat.occupantPerson.repId && getPersonSeat(p)?.table_number === table.tableNum).map(p => p.name).join("、")}
                                </p>
                              </TooltipContent>
                            )}
                            {!seat.occupantPerson && (
                              <TooltipContent side="top" className="text-xs">
                                點擊搜尋並分配座位
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      );})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Search popover for empty seat assignment */}
      {seatSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSeatSearchOpen(null)}>
          <div className="bg-white rounded-lg shadow-xl w-80 max-h-[400px] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  分配座位：桌 {seatSearchOpen.tableNum} - 位 {seatSearchOpen.seatNum}
                </span>
                <button onClick={() => setSeatSearchOpen(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  ref={seatSearchInputRef}
                  className="h-8 pl-8 text-sm"
                  placeholder="搜尋姓名、電郵或電話..."
                  value={seatSearchQuery}
                  onChange={(e) => setSeatSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {seatSearchResults.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {personList.filter(p => !isPersonAssigned(p)).length === 0 ? "全部人已分配座位" : "無符合搜尋結果"}
                </p>
              ) : (
                seatSearchResults.map((person) => (
                  <button
                    key={person.key}
                    onClick={() => handleSearchAssign(person)}
                    className={`w-full text-left px-2.5 py-2 rounded text-xs hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                      person.isCompanion ? "bg-purple-50/50" : "bg-gray-50"
                    }`}
                  >
                    <span className="font-medium truncate flex-1">{person.name}</span>
                    {person.isCompanion && (
                      <span className="text-[10px] text-purple-500 shrink-0">({person.companionOf}的同行人)</span>
                    )}
                    {!person.isCompanion && person.registrations[0]?.guest_count > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                        +{person.registrations[0].guest_count}同行
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
