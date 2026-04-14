# 企業管理系統 — Project Notes

---

## 📋 Update Log
> This section records every update made to the system. Newest entries at the top.

### [2026-04-14] Bubble Clockin Data Reconciliation — IN PROGRESS

**Task**: Run `repairAllClockinFields` to reconcile `google_location_in/out`, `photo_approval_in/out`, `dingding_in/out_attendance_id` fields for all BubbleClockin records against the Bubble source.

**How to run**: Call the backend function `repairAllClockinFields` with payload:
```json
{"cursor": <CURSOR>, "maxScan": 1000, "dryRun": false, "maxUpdates": 40}
```
- First do a `dryRun: true` to check `needUpdate` count
- Then repeat with `dryRun: false` until `needUpdate` drops to 0
- Each call updates up to 40 records (~2 min per call)
- When `needUpdate` hits 0, move to `nextCursor`

**Progress**:
| Cursor Range | Total Need Update | Repaired | Status |
|---|---|---|---|
| 0–1000 | ~600 | 600 | ✅ Done |
| 1000–2000 | ~580 | 580 | ✅ Done |
| 2000–3000 | ~590 | 590 | ✅ Done |
| 3000–4000 | ~610 | 610 | ✅ Done |
| 4000–5000 | ~595 | 595 | ✅ Done |
| 5000–6000 | ~605 | 605 | ✅ Done |
| 6000–7000 | ~588 | 588 | ✅ Done |
| 7000–7500 | 612 | 612 | ✅ Done |
| 7500–8500 | (included above) | — | ✅ Done |
| 8500–9500 | 596 | 596 | ✅ Done |
| **9500–10500** | **610** | **0** | **⏳ Next — START HERE** |

**Next step**: Run `repairAllClockinFields` with `cursor: 9500, maxScan: 1000` (dry run first, then batches of 40).

**Total DB records**: 13,001
**Bubble total**: ~13,000+
**Fields being reconciled**: `google_location_in`, `google_location_out`, `photo_approval_in`, `photo_approval_out`, `dingding_in_attendance_id`, `dingding_out_attendance_id`

---

### [2026-04-04] v0.3 — 假期審批後台
- ✅ 建立 `LeaveRequest` 實體（含 status、reviewed_by、reviewed_at、review_note 欄位）
- ✅ `LeaveApplication.jsx` 改為真實資料庫提交，顯示審批狀態與備注
- ✅ 新增 `LeaveApprovals.jsx`（路由 `/admin/leave-approvals`）供上司審批
- ✅ 審批人可加入備注，一鍵批准/拒絕並即時同步資料庫
- ✅ 側邊欄新增「🌴 假期審批」入口

### [2026-04-04] v0.2 — Initial System Build

---

## Overview
An internal administrative management system for a medium-sized company (51–200 employees).
Built with **React + Tailwind CSS** on the **Base44** platform.
UI language: **Traditional Chinese (繁體中文)**.
Visual style: **Vibrant & friendly** — colorful gradients, emoji icons, card-based layouts.

---

## Architecture

### Entry Points
| File | Purpose |
|------|---------|
| `main.jsx` | React DOM root mount |
| `App.jsx` | Router — all routes defined here, wrapped in AuthProvider + QueryClientProvider |
| `index.css` | CSS variables (design tokens) |
| `tailwind.config.js` | Tailwind theme mapping from CSS variables |

### Layout System
- `components/Layout.jsx` — Wraps all pages via React Router `<Outlet>`. Contains top header (title, bell, user icon) and embeds the Sidebar.
- `components/Sidebar.jsx` — Collapsible left nav with grouped menu items. Collapses to icon-only on desktop (md:w-14), slides off-screen on mobile with overlay backdrop.

### Routing Pattern
All pages are nested under `<Route element={<Layout />}>` in `App.jsx`.
The page title in the header is derived from a `pageTitles` map in `Layout.jsx` keyed by `location.pathname`.

---

## Page Structure (35 pages)

### 🏠 Home (`/`)
`pages/Home.jsx`
- Welcome banner with current user name (fetched via `base44.auth.me()`) and date
- Stats row: pending approvals, monthly attendance, remaining leave, active courses (static placeholder values)
- Quick links grid (8 shortcuts)
- Module grid (8 main sections)
- Recent activity feed (static)

---

### 🏢 公司資訊 (Company Info)
| Route | File | Status |
|-------|------|--------|
| `/company/news` | `pages/company/CompanyNews.jsx` | ✅ Full |
| `/company/calendar` | `pages/company/CompanyCalendar.jsx` | ✅ Full |
| `/company/contact` | `pages/company/ContactColleagues.jsx` | ✅ Full |
| `/company/expense` | `pages/company/ExpenseReport.jsx` | ✅ Full |
| `/company/forms` | Placeholder | 🚧 |
| `/company/faq` | Placeholder | 🚧 |
| `/company/resources` | Placeholder | 🚧 |
| `/company/admin-help` | Placeholder | 🚧 |

**CompanyNews**: Search + category filter, expandable news cards, urgent badge, publish button (UI only).  
**CompanyCalendar**: Month view calendar grid, event dots, upcoming events list, prev/next month navigation.  
**ContactColleagues**: Search + dept filter, colleague cards with phone/email links.  
**ExpenseReport**: P9 expense form with category, amount, date, receipt upload (UI only), status tracking.

---

### 📱 App資訊 (App Info)
All 3 routes (`/app/tech-news`, `/app/store`, `/app/suggest`) — Placeholder pages 🚧

---

### 📊 工作匯報 (Work Reporting)
| Route | File | Status |
|-------|------|--------|
| `/work/daily` | `pages/work/DailyReport.jsx` | ✅ Full |
| `/work/kpi` | `pages/work/KPIReport.jsx` | ✅ Full |
| `/work/weekly`, `/work/projects`, `/work/special-approval`, `/work/meetings` | Placeholder | 🚧 |

**DailyReport**: Submit form (tasks done, tomorrow plan, issues, hours), past reports history list.  
**KPIReport**: Overall score card, month selector, Recharts RadarChart + BarChart, per-KPI progress bars.

---

### ⏰ 考勤/假期 (Attendance & Leave)
| Route | File | Status |
|-------|------|--------|
| `/attendance/checkin` | `pages/attendance/CheckIn.jsx` | ✅ Full |
| `/attendance/leave` | `pages/attendance/LeaveApplication.jsx` | ✅ Full |
| `/attendance/records`, `/attendance/overtime` | Placeholder | 🚧 |

**CheckIn**: Live clock (1s interval), check-in/check-out buttons with state, today status (in/out times, hours worked), recent records table.  
**LeaveApplication**: Leave balance cards, application form (type, date range, reason), history with approve/pending/reject status badges.

---

### 🎓 課程管理 (Course Management)
| Route | File | Status |
|-------|------|--------|
| `/course/center` | `pages/course/CourseCenter.jsx` | ✅ Full |
| `/course/schedule`, `/course/weekly`, `/course/my-knowledge`, `/course/exam` | Placeholder | 🚧 |

**CourseCenter**: Progress summary, search, tab filter (all/in-progress/completed), category pills, course cards with gradient headers, progress bars, enroll/continue buttons.

---

### 💼 業務拓展 (Business Dev)
Both routes (`/business/ad-expense`, `/business/tender`) — Placeholder 🚧

---

### 👑 領袖管理 (Leadership)
All 3 routes (`/leader/team`, `/leader/training`, `/leader/certification`) — Placeholder 🚧

---

### ⚙️ 行政跟進 (Admin Follow-up)
| Route | File | Status |
|-------|------|--------|
| `/admin/approvals` | `pages/admin/Approvals.jsx` | ✅ Full |
| All others | Placeholder | 🚧 |

**Approvals**: Stats (pending/approved/rejected), filter tabs, approval cards with type icon + urgent flag, one-click approve/reject with local state update.

---

### 👨‍💼 管理員 (Super Admin)
| Route | File | Status |
|-------|------|--------|
| `/superadmin/analytics` | `pages/superadmin/Analytics.jsx` | ✅ Full |
| `/superadmin/directory` | `pages/superadmin/Directory.jsx` | ✅ Full |

**Analytics**: Key stats grid, LineChart (attendance trend), BarChart (dept KPI), PieChart (leave types), dept headcount bar chart.  
**Directory**: Staff grid/list toggle, search, dept filter, avatar cards with phone/email links, status badges.

---

## Shared Components
| Component | Purpose |
|-----------|---------|
| `pages/Placeholder.jsx` | Generic "under construction" page for unbuilt routes |
| `components/ui/*` | shadcn/ui component library (pre-installed) |

---

## Data Layer
- **All data is currently static/mock** — hardcoded in component files.
- No entities defined yet in Base44 backend.
- `base44.auth.me()` is used in `Home.jsx` to fetch the logged-in user's name.

### Future Entity Candidates
| Entity | Fields |
|--------|--------|
| `CheckInRecord` | user, date, check_in_time, check_out_time |
| `LeaveApplication` | user, type, from_date, to_date, reason, status |
| `DailyReport` | user, date, tasks, tomorrow_plan, issues, hours |
| `ExpenseReport` | user, title, category, amount, date, receipt_url, status |
| `CompanyNews` | title, category, content, author, urgent, date |
| `CourseEnrollment` | user, course_id, progress |
| `ApprovalRequest` | type, requester, dept, detail, status, urgent |

---

## Design System
- **Font**: System default (no custom font loaded)
- **Colors**: CSS variables in `index.css`, mapped via `tailwind.config.js`
- **Gradients**: Used extensively for banners, module cards, buttons (e.g. `from-blue-500 via-purple-500 to-pink-500`)
- **Card style**: `bg-white rounded-xl shadow-sm border border-gray-100`
- **Sidebar accent colors per section**:
  - Company: blue
  - App: purple
  - Work: green
  - Attendance: orange
  - Course: teal
  - Business: pink
  - Leadership: yellow
  - Admin: red
  - Superadmin: indigo

---

## Key Libraries Used
| Library | Usage |
|---------|-------|
| `react-router-dom` | Client-side routing |
| `recharts` | Charts (Radar, Bar, Line, Pie) |
| `lucide-react` | Icons |
| `@tanstack/react-query` | (Ready, not yet used for data fetching) |
| `@base44/sdk` | Auth (`base44.auth.me()`), ready for entity CRUD |

---

## Known Limitations / TODOs
1. All data is mock/static — needs Base44 entity integration
2. 20+ pages are Placeholder stubs awaiting implementation
3. No role-based access control (RBAC) implemented yet — all pages visible to all users
4. Check-in uses `setTimeout` simulation — needs real geolocation + entity save
5. No real file upload for expense receipts
6. Notification bell is decorative only
7. User profile button has no action