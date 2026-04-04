import { useState, useEffect } from "react";
import { MapPin, Clock, CheckCircle } from "lucide-react";

export default function CheckIn() {
  const [time, setTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    setLoading(true);
    setTimeout(() => {
      setCheckedIn(true);
      setCheckInTime(new Date());
      setLoading(false);
    }, 1200);
  };

  const handleCheckOut = () => {
    setLoading(true);
    setTimeout(() => {
      setCheckedOut(true);
      setCheckOutTime(new Date());
      setLoading(false);
    }, 1200);
  };

  const fmt = (d) => d?.toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const today = new Date().toLocaleDateString("zh-HK", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const records = [
    { date: "2026-04-03 (五)", checkIn: "09:01", checkOut: "18:05", status: "正常" },
    { date: "2026-04-02 (四)", checkIn: "08:55", checkOut: "18:30", status: "正常" },
    { date: "2026-04-01 (三)", checkIn: "09:15", checkOut: "18:00", status: "遲到" },
    { date: "2026-03-31 (二)", checkIn: "08:58", checkOut: "18:02", status: "正常" },
    { date: "2026-03-30 (一)", checkIn: "09:00", checkOut: "18:00", status: "正常" },
  ];

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Clock */}
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-6 text-white text-center shadow-lg">
        <div className="text-5xl font-bold font-mono tracking-wide">{fmt(time)}</div>
        <div className="text-sm opacity-80 mt-2">{today}</div>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs opacity-70">
          <MapPin size={12} /> 公司總部 · 香港九龍
        </div>
      </div>

      {/* Check In / Out Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCheckIn}
          disabled={checkedIn || loading}
          className={`rounded-2xl p-6 text-white font-bold text-lg shadow-md transition-all ${
            checkedIn
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-br from-green-400 to-green-600 hover:scale-105 active:scale-95"
          }`}
        >
          {loading && !checkedIn ? "⏳" : checkedIn ? <CheckCircle size={24} className="mx-auto" /> : "👆"}
          <div className="text-sm font-medium mt-1">{checkedIn ? `已簽到 ${fmt(checkInTime)}` : "簽到"}</div>
        </button>
        <button
          onClick={handleCheckOut}
          disabled={!checkedIn || checkedOut || loading}
          className={`rounded-2xl p-6 text-white font-bold text-lg shadow-md transition-all ${
            !checkedIn || checkedOut
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-br from-red-400 to-red-600 hover:scale-105 active:scale-95"
          }`}
        >
          {checkedOut ? <CheckCircle size={24} className="mx-auto" /> : "🚪"}
          <div className="text-sm font-medium mt-1">{checkedOut ? `已簽退 ${fmt(checkOutTime)}` : "簽退"}</div>
        </button>
      </div>

      {/* Today Status */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Clock size={16} /> 今日狀態</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">{checkInTime ? fmt(checkInTime) : "--:--"}</div>
            <div className="text-xs text-gray-500 mt-1">簽到時間</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-lg font-bold text-red-500">{checkOutTime ? fmt(checkOutTime) : "--:--"}</div>
            <div className="text-xs text-gray-500 mt-1">簽退時間</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-500">
              {checkInTime && checkOutTime
                ? `${Math.floor((checkOutTime - checkInTime) / 3600000)}h`
                : checkedIn ? "進行中" : "--"}
            </div>
            <div className="text-xs text-gray-500 mt-1">工作時數</div>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📋 近期記錄</h3>
        <div className="space-y-2">
          {records.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50 text-sm">
              <span className="text-gray-600">{r.date}</span>
              <span className="text-green-600">{r.checkIn}</span>
              <span className="text-red-500">{r.checkOut}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "正常" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}