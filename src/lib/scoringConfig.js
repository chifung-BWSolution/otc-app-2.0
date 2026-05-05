// 10 work skill items for boss scoring
export const SKILL_ITEMS = [
  {
    key: "ai_application",
    label: "人工智能AI應用能力",
    icon: "🤖",
    descriptions: {
      1: "完全不了解或不使用 AI 工具，對 AI 概念陌生",
      2: "偶爾使用基本 AI 工具，但缺乏主動應用意識",
      3: "能使用常見 AI 工具輔助日常工作，有基本應用能力",
      4: "善於將 AI 融入工作流程，提升效率並分享經驗",
      5: "精通多種 AI 工具，能創新應用並推動團隊 AI 轉型",
    },
  },
  {
    key: "presentation",
    label: "演說及表達能力",
    icon: "🎤",
    descriptions: {
      1: "表達含糊不清，難以傳達想法",
      2: "能基本表達觀點，但組織和說服力不足",
      3: "表達清晰有條理，能在團隊會議中有效溝通",
      4: "演說具感染力，能在較大場合自信表達並說服他人",
      5: "卓越的演說和表達能力，能啟發和帶動團隊方向",
    },
  },
  {
    key: "training",
    label: "培訓同事 / 接受培訓",
    icon: "📚",
    descriptions: {
      1: "不參與培訓活動，也不分享知識",
      2: "偶爾參與培訓，被動接受學習",
      3: "積極參與培訓並能將所學應用於工作",
      4: "主動分享知識，協助培訓新同事，學習態度優秀",
      5: "能設計和主導培訓課程，是團隊知識傳承的核心人物",
    },
  },
  {
    key: "asana_update",
    label: "每日Asana更新",
    icon: "📋",
    descriptions: {
      1: "幾乎從不更新 Asana，任務狀態長期過時",
      2: "偶爾更新，但常遺漏或延遲",
      3: "大部分時間能按時更新 Asana 任務狀態",
      4: "每日準時更新，記錄清晰詳盡",
      5: "更新及時且質量極高，成為團隊項目管理的標杆",
    },
  },
  {
    key: "teamwork",
    label: "團隊合作與溝通",
    icon: "🤝",
    descriptions: {
      1: "缺乏合作意識，溝通困難",
      2: "能完成份內工作，但跨團隊合作較弱",
      3: "能有效配合團隊工作，溝通順暢",
      4: "主動協助他人，跨部門合作能力強，溝通高效",
      5: "團隊合作的典範，能促進團隊凝聚力和整體效能",
    },
  },
  {
    key: "problem_solving",
    label: "問題解決與應變能力",
    icon: "💡",
    descriptions: {
      1: "遇到問題束手無策，需要他人全程指導",
      2: "能處理簡單問題，但複雜情況需要協助",
      3: "能獨立解決大部分工作問題，有一定應變能力",
      4: "善於分析問題根源，能提出創新解決方案",
      5: "卓越的問題解決能力，能在高壓下快速應變和決策",
    },
  },
  {
    key: "time_management",
    label: "時間管理與工作效率",
    icon: "⏱️",
    descriptions: {
      1: "時間管理混亂，經常延誤交付",
      2: "偶爾能按時完成，但優先次序管理不佳",
      3: "能合理安排時間，按時完成大部分任務",
      4: "時間管理高效，能同時處理多項任務且保持質量",
      5: "極致高效，能優化團隊工作流程並帶動整體效率提升",
    },
  },
  {
    key: "initiative",
    label: "主動性與積極度",
    icon: "🔥",
    descriptions: {
      1: "被動等待指示，缺乏主動性",
      2: "能完成分配任務，但很少主動承擔額外工作",
      3: "有一定主動性，偶爾會提出改進建議",
      4: "積極主動，經常自發承擔任務並推動改進",
      5: "高度自驅力，是團隊的積極推動者和變革引領者",
    },
  },
  {
    key: "continuous_learning",
    label: "持續學習與自我成長",
    icon: "🌱",
    descriptions: {
      1: "缺乏學習動力，技能停滯不前",
      2: "偶爾學習新知識，但缺乏系統性",
      3: "有持續學習意識，定期更新專業知識",
      4: "積極追求成長，能將新知識轉化為工作價值",
      5: "學習標杆，持續突破自我並帶動團隊學習文化",
    },
  },
  {
    key: "leadership_potential",
    label: "領導潛力與影響力",
    icon: "👑",
    descriptions: {
      1: "缺乏影響力，不具備領導潛質",
      2: "有潛質但尚未展現領導能力",
      3: "能在小範圍內發揮影響力，有一定帶領能力",
      4: "具備明確的領導力，能帶動和激勵同事",
      5: "卓越領導潛力，能引領方向並建立團隊文化",
    },
  },
];

// Determine scoring weights based on team/BU
// BW: Share GP 50%, Project 30%, Extra 10%, Skills 10%
// Front (all others): Project 60%, Extra 20%, Skills 20%
export function getTeamWeights(staffBu) {
  const isBW = staffBu && (staffBu.toUpperCase().startsWith("BW") || staffBu.toUpperCase().includes("BW"));
  if (isBW) {
    return {
      type: "BW",
      gp: 50,
      project: 30,
      extra: 10,
      skill: 10,
      total: 100,
    };
  }
  return {
    type: "Front",
    gp: 0,
    project: 60,
    extra: 20,
    skill: 20,
    total: 100,
  };
}

// Calculate GP score: average of GP amounts → score out of 5 by boss, then scale
export function calcGpScore(gpFields, bossGpScore, maxPoints) {
  if (!bossGpScore || bossGpScore <= 0) return { score: 0, bossScore: 0 };
  const score = (bossGpScore / 5) * maxPoints;
  return { score, bossScore: bossGpScore };
}

// Calculate skill scores: average of all boss skill scores, then scale
export function calcSkillScore(skillScores, maxPoints) {
  if (!skillScores || skillScores.length === 0) return { score: 0, avg: 0, count: 0 };
  const scored = skillScores.filter(s => s.boss_score > 0);
  if (scored.length === 0) return { score: 0, avg: 0, count: 0 };
  const avg = scored.reduce((a, s) => a + s.boss_score, 0) / scored.length;
  const score = (avg / 5) * maxPoints;
  return { score, avg: Math.round(avg * 10) / 10, count: scored.length };
}