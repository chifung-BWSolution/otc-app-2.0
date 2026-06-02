import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Fetches Staff Q&A answers for a given staff bubble_id,
 * joined with questions and categories.
 */
export function useStaffQA(staffBubbleId) {
  const [qaData, setQaData] = useState([]);  // grouped by category
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }

    async function load() {
      // Fetch all 3 entities in parallel
      const [answers, questions, categories] = await Promise.all([
        base44.entities.StaffQAAnswer.filter({ staff_id: staffBubbleId, is_active: true }, '-created_date', 500),
        base44.entities.StaffQAQuestion.filter({ is_active: true }, 'bubble_id', 500),
        base44.entities.StaffQACategory.filter({ is_active: true }, 'bubble_id', 100),
      ]);

      // Build lookup maps
      const questionMap = {};
      for (const q of questions) {
        questionMap[q.bubble_id] = q;
      }
      const categoryMap = {};
      for (const c of categories) {
        categoryMap[c.bubble_id] = c;
      }

      // Group answers by category
      const grouped = {};
      for (const ans of answers) {
        const question = questionMap[ans.question_id];
        if (!question) continue;
        const category = categoryMap[question.category_id];
        const catKey = category ? category.bubble_id : '_uncategorized';
        const catDisplay = category ? category.display : '其他';

        if (!grouped[catKey]) {
          grouped[catKey] = { category: catDisplay, type: category?.type || '', items: [] };
        }
        grouped[catKey].items.push({
          question: question.question,
          answer: ans.answer_text,
          option_point: ans.option_point,
          is_option: question.is_option,
          options: [question.option_1, question.option_2, question.option_3, question.option_4].filter(Boolean),
        });
      }

      setQaData(Object.values(grouped));
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [staffBubbleId]);

  return { qaData, loading };
}