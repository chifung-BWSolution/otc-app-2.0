import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AttendanceList({ eventId }) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch all registrations
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("*, event_sections(name)")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .order("registered_at");

    // Fetch attendance records
    const { data: records } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("event_id", eventId);

    if (regs) setRegistrations(regs);
    if (records) {
      const map = {};
      records.forEach((r) => {
        map[r.registration_id] = r;
      });
      setAttendanceMap(map);
    }
    setLoading(false);
  };

  const toggleAttendance = async (registrationId, currentlyAttended) => {
    const existing = attendanceMap[registrationId];
    if (existing) {
      await supabase
        .from("attendance_records")
        .update({
          attended: !currentlyAttended,
          check_in_time: !currentlyAttended ? new Date().toISOString() : null,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("attendance_records").insert({
        event_id: eventId,
        registration_id: registrationId,
        attended: true,
        check_in_time: new Date().toISOString(),
      });
    }
    fetchData();
  };

  const attendedCount = Object.values(attendanceMap).filter((r) => r.attended).length;

  const exportCSV = () => {
    if (registrations.length === 0) return;
    const header = ["姓名", "電郵", "場次", "出席", "簽到時間"];
    const rows = registrations.map((r) => [
      r.form_data?.name || "",
      r.form_data?.email || "",
      r.event_sections?.name || "",
      attendanceMap[r.id]?.attended ? "是" : "否",
      attendanceMap[r.id]?.check_in_time
        ? new Date(attendanceMap[r.id].check_in_time).toLocaleString("zh-HK")
        : "",
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "已匯出出席名單" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">✅ 出席管理</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            出席：{attendedCount} / {registrations.length}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" />
          匯出
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">載入中...</p>
        ) : registrations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暫無報名記錄</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">出席</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>電郵</TableHead>
                  <TableHead>場次</TableHead>
                  <TableHead>簽到時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => {
                  const record = attendanceMap[reg.id];
                  const attended = record?.attended || false;
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Checkbox
                          checked={attended}
                          onCheckedChange={() =>
                            toggleAttendance(reg.id, attended)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {reg.form_data?.name || "-"}
                      </TableCell>
                      <TableCell>{reg.form_data?.email || "-"}</TableCell>
                      <TableCell>{reg.event_sections?.name || "-"}</TableCell>
                      <TableCell className="text-xs">
                        {record?.check_in_time
                          ? new Date(record.check_in_time).toLocaleString("zh-HK")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
