import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Fetches Staff Q&A answers for a given staff bubble_id,
 * joined with questions and categories.
 */
export function useStaffQA(staffBubbleId) {
  const [skillsData, setSkillsData] = useState([]);
  const [hobbiesData, setHobbiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }

    async function load() {
      const [answers, questions, categories] = await Promise.all([
        base44.entities.StaffQAAnswer.filter({ staff_id: staffBubbleId, is_active: true }, '-created_date', 500),
        base44.entities.StaffQAQuestion.filter({ is_active: true }, 'bubble_id', 500),
        base44.entities.StaffQACategory.filter({ is_active: true }, 'bubble_id', 100),
      ]);

      const questionMap = {};
      for (const q of questions) questionMap[q.bubble_id] = q;
      const categoryMap = {};
      for (const c of categories) categoryMap[c.bubble_id] = c;

      const grouped = {};
      for (const ans of answers) {
        const question = questionMap[ans.question_id];
        if (!question || !question.is_active) continue;
        const category = categoryMap[question.category_id];
        const catKey = category ? category.bubble_id : '_uncategorized';
        const catDisplay = category ? category.display : '其他';
        const catType = category?.type || 'Hobbies';

        if (!grouped[catKey]) {
          grouped[catKey] = { category: catDisplay, type: catType, items: [] };
        }
        const options = [question.option_1, question.option_2, question.option_3, question.option_4].filter(Boolean);
        const selectedIndex = (ans.option_point != null && options.length > 0)
          ? options.length - ans.option_point
          : -1;

        grouped[catKey].items.push({
          question: question.question,
          answer: ans.answer_text,
          option_point: ans.option_point,
          is_option: question.is_option,
          options,
          selectedIndex,
        });
      }

      const all = Object.values(grouped);
      setSkillsData(all.filter(g => g.type === 'Skills'));
      setHobbiesData(all.filter(g => g.type !== 'Skills'));
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [staffBubbleId]);

  return { skillsData, hobbiesData, loading };
}