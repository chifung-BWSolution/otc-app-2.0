import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";

export default function EventRegistrationPublic() {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form data
  const [formData, setFormData] = useState({});
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);
  const [invitedBy, setInvitedBy] = useState("");
  const [inviterSearch, setInviterSearch] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [guestNames, setGuestNames] = useState([]);
  const [staffSearch, setStaffSearch] = useState({});

  useEffect(() => {
    fetchFormData();
  }, [slug]);

  const fetchFormData = async () => {
    setLoading(true);
    // Get form by slug
    const { data: formRecord, error: formError } = await supabase
      .from("registration_forms")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (formError || !formRecord) {
      setError("找不到報名表格或表格已停用");
      setLoading(false);
      return;
    }

    setForm(formRecord);

    // Get event
    const { data: eventRecord } = await supabase
      .from("events")
      .select("*")
      .eq("id", formRecord.event_id)
      .single();

    if (eventRecord) {
      setEvent(eventRecord);

      // Get sections - filter by form's section_ids if set
      if (eventRecord.registration_mode === "multi_section") {
        const query = supabase
          .from("event_sections")
          .select("*")
          .eq("event_id", eventRecord.id)
          .order("sort_order");

        const { data: secs } = await query;
        if (secs) {
          // Filter sections if form has specific section_ids
          const formSectionIds = formRecord.section_ids || [];
          if (formSectionIds.length > 0) {
            setSections(secs.filter((s) => formSectionIds.includes(s.id)));
          } else {
            setSections(secs);
          }
        }
      }
    }

    // Get staff list via edge function (bypasses RLS for public access)
    try {
      const staffFilterTeams = formRecord.staff_filter_teams || [];
      const invokeBody = staffFilterTeams.length > 0 ? { body: { teams: staffFilterTeams } } : {};
      const { data: staffRes, error: staffErr } = await supabase.functions.invoke(
        "supabase-functions-publicStaffList",
        invokeBody
      );
      if (!staffErr && staffRes?.data) {
        setStaffList(staffRes.data);
      } else if (!staffErr && staffRes && Array.isArray(staffRes)) {
        setStaffList(staffRes);
      } else {
        console.error("Staff list error:", staffErr, staffRes);
      }
    } catch (e) {
      console.error("Failed to fetch staff list:", e);
    }

    setLoading(false);
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validate required fields
    const fields = form.fields_config || [];
    const sectionSelectionMode = form.section_selection_mode || "single";
    for (const field of fields) {
      if (field.required && !formData[field.key]?.trim()) {
        setError(`請填寫「${field.label}」`);
        setSubmitting(false);
        return;
      }
    }

    // Validate section selection
    if (sections.length > 0) {
      if (sectionSelectionMode === "multi" && selectedSections.length === 0) {
        setError("請至少選擇一個場次");
        setSubmitting(false);
        return;
      } else if (sectionSelectionMode === "single" && !selectedSection) {
        setError("請選擇場次");
        setSubmitting(false);
        return;
      }
    }

    // Validate guest names
    const maxGuests = form.max_guests_per_registration || 0;
    if (guestCount > 0) {
      for (let i = 0; i < guestCount; i++) {
        if (!guestNames[i]?.trim()) {
          setError(`請填寫第 ${i + 1} 位同行者姓名`);
          setSubmitting(false);
          return;
        }
      }
    }

    // Check capacity
    if (event?.max_capacity) {
      const { count } = await supabase
        .from("event_registrations")
        .select("id", { count: "exact" })
        .eq("event_id", event.id)
        .eq("status", "confirmed");

      if (count >= event.max_capacity) {
        setError("報名已滿，無法提交");
        setSubmitting(false);
        return;
      }
    }

    // Check duplicate
    if (!event?.allow_duplicate_registration && formData.email) {
      const { data: existing } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("status", "confirmed")
        .contains("form_data", { email: formData.email });

      if (existing && existing.length > 0) {
        setError("你已經報名過此活動");
        setSubmitting(false);
        return;
      }
    }

    // Submit
    let submitSuccess = false;
    if (sectionSelectionMode === "multi" && selectedSections.length > 0) {
      // Multi-section: create one registration per section
      for (const secId of selectedSections) {
        const { error: insertError } = await supabase.from("event_registrations").insert({
          event_id: event.id,
          form_id: form.id,
          section_id: secId,
          form_data: formData,
          invited_by_staff_id: invitedBy || null,
          registration_source: "link",
          status: "confirmed",
          guest_count: guestCount,
          guest_names: guestNames.slice(0, guestCount).filter(Boolean),
        });
        if (insertError) {
          setError("提交失敗：" + insertError.message);
          setSubmitting(false);
          return;
        }
      }
      submitSuccess = true;
    } else {
      // Single section
      const { error: insertError } = await supabase.from("event_registrations").insert({
        event_id: event.id,
        form_id: form.id,
        section_id: selectedSection || null,
        form_data: formData,
        invited_by_staff_id: invitedBy || null,
        registration_source: "link",
        status: "confirmed",
        guest_count: guestCount,
        guest_names: guestNames.slice(0, guestCount).filter(Boolean),
      });

      if (insertError) {
        setError("提交失敗：" + insertError.message);
      } else {
        submitSuccess = true;
      }
    }

    if (submitSuccess) {
      // Fetch submission_success RSVP template (active or inactive fallback)
      let tpl = null;
      const { data: activeTpls } = await supabase
        .from("event_rsvp_templates")
        .select("body")
        .eq("event_id", event.id)
        .eq("template_type", "submission_success")
        .eq("is_active", true)
        .limit(1);
      tpl = activeTpls?.[0] || null;

      // Fallback: if no active template, try any template for this event
      if (!tpl) {
        const { data: anyTpls } = await supabase
          .from("event_rsvp_templates")
          .select("body")
          .eq("event_id", event.id)
          .eq("template_type", "submission_success")
          .limit(1);
        tpl = anyTpls?.[0] || null;
      }

      if (tpl?.body) {
        // Replace template variables - support both {{var}} and @var formats
        let msg = tpl.body;
        const vars = {
          "活動名稱": event.title || "",
          "參加者姓名": formData.name || formData.姓名 || "",
          "日期": event.start_date || "",
          "地點": event.location || "",
          "場次名稱": sections.find((s) => s.id === selectedSection)?.name || 
            sections.filter((s) => selectedSections.includes(s.id)).map((s) => s.name).join(", ") || "",
        };
        for (const [key, val] of Object.entries(vars)) {
          msg = msg.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
          msg = msg.replace(new RegExp(`@${key}`, "g"), val);
        }
        setSuccessMessage(msg);
      }
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  // No auto-close - user manually closes window

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-4xl mb-4">😔</p>
            <p className="text-lg font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">報名成功！</h2>
            {successMessage ? (
              <p className="text-muted-foreground whitespace-pre-line">
                {successMessage}
              </p>
            ) : (
              <p className="text-muted-foreground">
                感謝你的報名，我們已收到你的資料。
              </p>
            )}
            <Button
              className="mt-6"
              onClick={() => {
                window.close();
              }}
            >
              關閉視窗
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              你可手動關閉此分頁。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields = form?.fields_config || [];
  const maxGuests = form?.max_guests_per_registration || 0;
  const showInviter = form?.show_inviter_field ?? true;
  const sectionSelectionMode = form?.section_selection_mode || "single";

  // Filter staff for dynamic_staff search
  const getFilteredStaff = (fieldKey) => {
    const search = (staffSearch[fieldKey] || "").toLowerCase();
    if (!search) return [];
    return staffList.filter(
      (s) =>
        (s.name_zh || "").toLowerCase().includes(search) ||
        (s.name_en || "").toLowerCase().includes(search)
    ).slice(0, 20);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Event Info */}
        {event && (
          <Card className="mb-6 overflow-hidden">
            {event.cover_image_url && (
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full max-h-72 object-contain bg-black/5"
              />
            )}
            <CardContent className="p-6">
              <h1 className="text-xl font-bold mb-2">{event.title}</h1>
              {event.start_datetime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {(() => { const d = new Date(event.start_datetime); const m = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]; return `${d.getUTCFullYear()}年${m[d.getUTCMonth()]}${d.getUTCDate()}日`; })()}
                    {event.end_datetime && (
                      <>
                        {" "}
                        至{" "}
                        {(() => { const d = new Date(event.end_datetime); const m = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]; return `${m[d.getUTCMonth()]}${d.getUTCDate()}日`; })()}
                      </>
                    )}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.description && (
                <p className="text-sm mt-3 whitespace-pre-wrap">{event.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{form?.title || "報名表格"}</CardTitle>
            {form?.description && (
              <p className="text-sm text-muted-foreground">{form.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section selection */}
              {sections.length > 0 && (
                <div>
                  <Label>
                    選擇場次 *
                    {sectionSelectionMode === "multi" && (
                      <span className="text-xs text-muted-foreground ml-2">（可多選）</span>
                    )}
                  </Label>
                  {sectionSelectionMode === "multi" ? (
                    <div className="space-y-2 mt-1">
                      {sections.map((sec) => (
                        <label
                          key={sec.id}
                          className="flex items-start gap-2 p-2 border rounded-md cursor-pointer hover:bg-slate-50"
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={selectedSections.includes(sec.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSections((prev) => [...prev, sec.id]);
                              } else {
                                setSelectedSections((prev) =>
                                  prev.filter((id) => id !== sec.id)
                                );
                              }
                            }}
                          />
                          <span className="text-sm leading-snug break-words">
                            {sec.name}
                            {sec.max_capacity ? ` (限${sec.max_capacity}人)` : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger className="h-auto min-h-[40px] whitespace-normal [&>span]:line-clamp-none">
                        <SelectValue placeholder="請選擇場次" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((sec) => (
                          <SelectItem key={sec.id} value={sec.id} className="whitespace-normal">
                            <span className="block leading-snug">
                              {sec.name}
                              {sec.max_capacity ? ` (限${sec.max_capacity}人)` : ""}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Dynamic fields */}
              {fields.map((field) => (
                <div key={field.key}>
                  <Label>
                    {field.label} {field.required && "*"}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.label}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={formData[field.key] || ""}
                      onValueChange={(v) => handleFieldChange(field.key, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`選擇${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "dynamic_staff" ? (
                    <div className="space-y-1">
                      <Input
                        value={staffSearch[field.key] || ""}
                        onChange={(e) => {
                          setStaffSearch((prev) => ({ ...prev, [field.key]: e.target.value }));
                          // Clear selection if user is typing
                          if (formData[field.key]) {
                            handleFieldChange(field.key, "");
                          }
                        }}
                        placeholder="搜尋員工姓名..."
                      />
                      {staffSearch[field.key] && !formData[field.key] && (
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {getFilteredStaff(field.key).length === 0 && (
                            <p className="px-3 py-2 text-sm text-muted-foreground">沒有符合的結果</p>
                          )}
                          {getFilteredStaff(field.key).map((s) => {
                            const displayName = s.name_zh || s.name_en;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 ${
                                  formData[field.key] === displayName
                                    ? "bg-blue-50 text-blue-700"
                                    : ""
                                }`}
                                onClick={() => {
                                  handleFieldChange(field.key, displayName);
                                  setStaffSearch((prev) => ({ ...prev, [field.key]: "" }));
                                }}
                              >
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {formData[field.key] && !staffSearch[field.key] && (
                        <p className="text-xs text-green-600">
                          ✓ 已選擇：{formData[field.key]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      type={field.type || "text"}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.label}
                    />
                  )}
                </div>
              ))}

              {/* Guest count - built-in field */}
              {maxGuests > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <Label>同行人數（最多 {maxGuests} 位）</Label>
                    <Select
                      value={String(guestCount)}
                      onValueChange={(v) => {
                        const count = parseInt(v);
                        setGuestCount(count);
                        // Expand guest names array
                        setGuestNames((prev) => {
                          const arr = [...prev];
                          while (arr.length < count) arr.push("");
                          return arr;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇人數" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">無同行者</SelectItem>
                        {Array.from({ length: maxGuests }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1} 位
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {guestCount > 0 && (
                    <div className="space-y-2 pl-3 border-l-2 border-blue-200">
                      <p className="text-xs text-muted-foreground">請填寫同行者姓名：</p>
                      {Array.from({ length: guestCount }, (_, i) => (
                        <Input
                          key={i}
                          value={guestNames[i] || ""}
                          onChange={(e) => {
                            setGuestNames((prev) => {
                              const arr = [...prev];
                              arr[i] = e.target.value;
                              return arr;
                            });
                          }}
                          placeholder={`同行者 ${i + 1} 姓名 *`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inviter */}
              {showInviter && staffList.length > 0 && (
                <div className="space-y-1">
                  <Label>選擇邀請人（選填）</Label>
                  <Input
                    value={inviterSearch}
                    onChange={(e) => {
                      setInviterSearch(e.target.value);
                      if (invitedBy) {
                        setInvitedBy("");
                      }
                    }}
                    placeholder="搜尋邀請你的同事姓名..."
                  />
                  {(inviterSearch || !invitedBy) && inviterSearch !== "" && (
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {(() => {
                        const search = inviterSearch.toLowerCase();
                        const filtered = staffList.filter(
                          (s) =>
                            (s.name_zh || "").toLowerCase().includes(search) ||
                            (s.name_en || "").toLowerCase().includes(search)
                        ).slice(0, 20);
                        if (filtered.length === 0) {
                          return <p className="px-3 py-2 text-sm text-muted-foreground">沒有符合的結果</p>;
                        }
                        return filtered.map((s) => {
                          const displayName = s.name_zh || s.name_en;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 ${
                                invitedBy === s.id ? "bg-blue-50 text-blue-700" : ""
                              }`}
                              onClick={() => {
                                setInvitedBy(s.id);
                                setInviterSearch("");
                              }}
                            >
                              {displayName}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                  {invitedBy && !inviterSearch && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600">
                        ✓ 已選擇：{(() => {
                          const s = staffList.find((st) => st.id === invitedBy);
                          return s ? (s.name_zh || s.name_en) : invitedBy;
                        })()}
                      </p>
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => { setInvitedBy(""); setInviterSearch(""); }}
                      >
                        清除
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "提交中..." : "提交報名"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
