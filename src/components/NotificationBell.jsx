import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, RefreshCw, XCircle, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (currentUser?.email) loadNotifications();
  }, [currentUser]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadNotifications = async () => {
    const data = await base44.entities.Notification.filter(
      { recipient_email: currentUser.email },
      "-created_date",
      30
    );
    setNotifications(data);
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  const handleAction = async (notif, action) => {
    await base44.entities.Notification.update(notif.id, {
      action_taken: action,
      is_read: true,
    });
    setNotifications(n => n.map(x => x.id === notif.id ? { ...x, action_taken: action, is_read: true } : x));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-bold text-gray-800 text-sm">通知</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700">全部已讀</button>
              )}
              <button onClick={() => setOpen(false)}><X size={15} className="text-gray-400" /></button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">沒有通知</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-50 transition-colors ${!notif.is_read ? "bg-blue-50/60" : "bg-white"}`}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0 mt-0.5">
                      {notif.type === "app_expiry" ? "⚠️" : "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-800">{notif.title}</div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>

                      {/* Action buttons for expiry notifications */}
                      {notif.type === "app_expiry" && notif.action_taken === "pending" && (
                        <div className="flex gap-1.5 mt-2">
                          <button
                            onClick={e => { e.stopPropagation(); handleAction(notif, "renew"); }}
                            className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 font-semibold transition-colors"
                          >
                            <RefreshCw size={10} /> 確認續訂
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleAction(notif, "cancel"); }}
                            className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <XCircle size={10} /> 不續訂
                          </button>
                        </div>
                      )}

                      {notif.action_taken === "renew" && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium">
                          <CheckCircle size={11} /> 已確認續訂
                        </div>
                      )}
                      {notif.action_taken === "cancel" && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
                          <XCircle size={11} /> 已決定不續訂
                        </div>
                      )}

                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(notif.created_date).toLocaleDateString("zh-HK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}