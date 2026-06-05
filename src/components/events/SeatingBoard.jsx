import { useState, useEffect } from "react";
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
import { Download, Plus, Minus, Users, X } from "lucide-react";
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

  useEffect(() => {
    fetchSections();
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [eventId, selectedSectionId]);

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

  const assignSeat = async (person, tableNumber, seatNumber) => {
    const regId = person.repId;
    const guestIndex = person.guestIndex;
    const seatKey = person.seatKey;
    const existing = getPersonSeat(person);
    const sectionId = selectedSectionId !== "all" ? selectedSectionId : null;

    if (existing?.id) {
      await supabase
        .from("seating_arrangements")
        .update({
          table_number: tableNumber,
          seat_number: seatNumber,
          section_id: sectionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("seating_arrangements").insert({
        event_id: eventId,
        registration_id: regId,
        guest_index: guestIndex,
        section_id: sectionId,
        table_number: tableNumber,
        seat_number: seatNumber,
      });
    }
    // Update local state immediately
    const newSeating = { ...seating };
    delete newSeating[seatKey];
    newSeating[seatKey] = {
      ...(seating[seatKey] || {}),
      registration_id: regId,
      guest_index: guestIndex,
      table_number: tableNumber,
      seat_number: seatNumber,
    };
    setSeating(newSeating);
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
    removeSeat(draggedPerson);
    toast({ title: "已取消座位分配" });
    setDraggedPerson(null);
    setDragSource(null);
  };

  const exportCSV = () => {
    const header = ["姓名", "身份", "所屬報名人", "電郵", "桌號", "座位號"];
    const rows = personList.map((p) => {
      const seat = getPersonSeat(p);
      return [
        p.name,
        p.isCompanion ? "同行人" : "報名人",
        p.isCompanion ? p.companionOf : "",
        p.registrations[0].form_data?.email || "",
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
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
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
            <div className="lg:w-64 shrink-0">
              <div
                className="border rounded-lg p-3"
                onDrop={handleDropOnUnassigned}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">未分配座位 ({unassigned.length})</span>
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {unassigned.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">全部已分配 ✓</p>
                  ) : (
                    unassigned.map((person) => (
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
                      {table.seats.map((seat) => (
                        <div
                          key={seat.seatNum}
                          onDrop={(e) => handleDrop(e, table.tableNum, seat.seatNum)}
                          onDragOver={handleDragOver}
                          draggable={!!seat.occupantPerson}
                          onDragStart={(e) => {
                            if (seat.occupantPerson) {
                              handleDragStart(e, seat.occupantPerson, "table");
                            }
                          }}
                          className={`relative min-h-[36px] rounded border text-xs flex items-center justify-center px-1 transition-colors ${
                            seat.occupantPerson
                              ? "bg-green-50 border-green-300 cursor-grab active:cursor-grabbing"
                              : "bg-gray-50 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          {seat.occupantPerson ? (
                            <div className="flex items-center gap-0.5 w-full">
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
                            <span className="text-[10px] text-muted-foreground">{seat.seatNum}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
