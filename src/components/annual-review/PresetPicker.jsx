import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check } from "lucide-react";

export default function PresetPicker({ category, value, onChange }) {
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    base44.entities.ReviewPreset.filter({ category, is_active: true }, "sort_order", 200)
      .then(setPresets);
  }, [category]);

  // Parse existing value into array of selected labels
  const selected = value
    ? value.split("\n").map(s => s.replace(/^[•\-]\s*/, "").trim()).filter(Boolean)
    : [];

  const toggle = (label) => {
    let next;
    if (selected.includes(label)) {
      next = selected.filter(s => s !== label);
    } else {
      next = [...selected, label];
    }
    onChange(next.length > 0 ? next.map(s => `• ${s}`).join("\n") : "");
  };

  if (presets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {presets.map(p => {
        const isActive = selected.includes(p.label);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.label)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isActive
                ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            {isActive && <Check size={11} />}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}