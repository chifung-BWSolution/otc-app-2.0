import { useState, useEffect } from "react";
import { MapPin, Clock, CheckCircle, AlertCircle, Loader2, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";

// ── 公司允許簽到的地點設定 ──────────────────────────────
// 請根據實際公司位置修改以下座標
const OFFICE_LOCATIONS = [
  { name: "公司總部", lat: 22.3193, lng: 114.1694, radiusMeters: 500 },
];
// ────────────────────────────────────────────────────────

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function checkWithinOffice(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const loc of OFFICE_LOCATIONS) {
    const dist = calcDistance(lat, lng, loc.lat, loc.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = loc;
    }
  }
  return { valid: minDist <= nearest.radiusMeters, distance: Math.round(minDist), officeName: nearest.name };
}

export default function CheckIn() {
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null); // null | 'locating' | 'success' | 'error' | 'out_of_range'
  const [geoMessage, setGeoMessage] = useState("");
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    base44.auth.me().then(setUser).catch(() => {});
    loadRecentRecords();
    return () => clearInterval(timer);
  }, []);

  const loadRecentRecords = async () => {
    const user = await base44.auth.me();
    if (!user) return;
    const records = await base44.entities.CheckInRecord.filter(
      { user_email: user.email },
      "-created_date",
      10
    );
    setRecentRecords(records);
  };

  const handleAction = async (actionType) => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("您的瀏覽器不支援地理定位功能");
      return;
    }
    setLoading(true);
    setGeoStatus("locating");
    setGeoMessage("正在獲取您的位置...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const { valid, distance, officeName } = checkWithinOffice(latitude, longitude);

        if (!valid) {
          setGeoStatus("out_of_range");
          setGeoMessage(`您距離${officeName}約 ${distance} 米，超出允許範圍（500米），無法簽到`);
          setLoading(false);
          return;
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const dateStr = now.toISOString().split("T")[0];

        await base44.entities.CheckInRecord.create({
          user_email: user?.email || "",
          user_name: user?.full_name || "",
          date: dateStr,
          type: actionType,
          time: timeStr,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          location_valid: true,
          distance_from_office: distance,
        });

        setGeoStatus("success");
        setGeoMessage(`${actionType === "check_in" ? "簽到" : "簽退"}成功！位於${officeName}（距離 ${distance} 米）`);

        if (actionType === "check_in") {
          setCheckedIn(true);
          setCheckInTime(now);
        } else {
          setCheckedOut(true);
          setCheckOutTime(now);
        }

        await loadRecentRecords();
        setLoading(false);
      },
      (error) => {
        const msgs = {
          1: "您拒絕了位置授權，請在瀏覽器設定中允許位置存取",
          2: "無法獲取位置資訊，請確認GPS已開啟",
          3: "定位超時，請稍後再試",
        };
        setGeoStatus("error");
        setGeoMessage(msgs[error.code] || "定位失敗，請稍後再試");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fmt = (d) =>
    d?.toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const today = new Date().toLocaleDateString("zh-HK", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = recentRecords.filter((r) => r.date === todayStr);
  const todayIn = todayRecords.find((r) => r.type === "check_in");
  const todayOut = todayRecords.find((r) => r.type === "check_out");

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Clock */}
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-6 text-white text-center shadow-lg">
        <div className="text-5xl font-bold font-mono tracking-wide">{fmt(time)}</div>
        <div className="text-sm opacity-80 mt-2">{today}</div>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs opacity-70">
          <MapPin size={12} /> 需在公司範圍內（500米）方可簽到
        </div>
      </div>

      {/* Geo Status Message */}
      {geoStatus && (
        <div className={`rounded-xl p-3 flex items-start gap-2 text-sm font-medium ${
          geoStatus === "success" ? "bg-green-50 border border-green-200 text-green-700" :
          geoStatus === "locating" ? "bg-blue-50 border border-blue-200 text-blue-700" :
          "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {geoStatus === "locating" ? <Loader2 size={18} className="animate-spin shrink-0 mt-0.5" /> :
           geoStatus === "success" ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> :
           <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          {geoMessage}
        </div>
      )}

      {/* Check In / Out Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAction("check_in")}
          disabled={checkedIn || loading}
          className={`rounded-2xl p-6 text-white font-bold text-lg shadow-md transition-all ${
            checkedIn
              ? "bg-gray-300 cursor-not-allowed"
              : loading && !checkedIn
              ? "bg-green-300 cursor-wait"
              : "bg-gradient-to-br from-green-400 to-green-600 hover:scale-105 active:scale-95"
          }`}
        >
          {loading && !checkedIn ? (
            <Loader2 size={24} className="mx-auto animate-spin" />
          ) : checkedIn ? (
            <CheckCircle size={24} className="mx-auto" />
          ) : (
            <Navigation size={24} className="mx-auto" />
          )}
          <div className="text-sm font-medium mt-1">
            {checkedIn ? `已簽到 ${fmt(checkInTime)}` : "簽到"}
          </div>
        </button>

        <button
          onClick={() => handleAction("check_out")}
          disabled={!checkedIn || checkedOut || loading}
          className={`rounded-2xl p-6 text-white font-bold text-lg shadow-md transition-all ${
            !checkedIn || checkedOut
              ? "bg-gray-300 cursor-not-allowed"
              : loading && checkedIn
              ? "bg-red-300 cursor-wait"
              : "bg-gradient-to-br from-red-400 to-red-600 hover:scale-105 active:scale-95"
          }`}
        >
          {checkedOut ? <CheckCircle size={24} className="mx-auto" /> : <MapPin size={24} className="mx-auto" />}
          <div className="text-sm font-medium mt-1">
            {checkedOut ? `已簽退 ${fmt(checkOutTime)}` : "簽退"}
          </div>
        </button>
      </div>

      {/* Today Status */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={16} /> 今日狀態
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-bold text-green-600">{todayIn?.time || "--:--"}</div>
            <div className="text-xs text-gray-500 mt-1">簽到時間</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm font-bold text-red-500">{todayOut?.time || "--:--"}</div>
            <div className="text-xs text-gray-500 mt-1">簽退時間</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-bold text-blue-500">
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
        {recentRecords.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">暫無記錄</p>
        ) : (
          <div className="space-y-2">
            {recentRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50 text-sm">
                <span className="text-gray-600">{r.date}</span>
                <span className={r.type === "check_in" ? "text-green-600" : "text-red-500"}>
                  {r.type === "check_in" ? "👆 簽到" : "🚪 簽退"} {r.time}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin size={10} /> {r.distance_from_office}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}