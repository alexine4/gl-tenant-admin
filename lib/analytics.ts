// There is no real conversation/event pipeline in this codebase (no chat
// widget, no event logging) for this API to query -- that data would
// normally come from a separate product service. This module generates
// deterministic, seeded figures instead: the same tenant_id + date always
// produces the same numbers, so the contract (shape, filtering, export)
// behaves and tests exactly like it would against a real data source. Swap
// `buildAnalyticsResponse` for a real query when that service exists; the
// route handler and response shape shouldn't need to change.

const TOPICS = [
  "Billing",
  "Onboarding",
  "Integrations",
  "Troubleshooting",
  "Account & Security",
  "Pricing",
] as const;

const SAMPLE_QUESTIONS: Record<(typeof TOPICS)[number], string[]> = {
  Billing: ["How do I update my payment method?", "Why was I charged twice?"],
  Onboarding: ["How do I invite my team?", "Where do I configure branding?"],
  Integrations: ["Do you support Slack?", "How do I connect my CRM?"],
  Troubleshooting: ["Why isn't the widget loading?", "My upload failed, why?"],
  "Account & Security": ["How do I reset my password?", "How do I enable SSO?"],
  Pricing: ["What's included in my plan?", "Do you offer annual billing?"],
};

const ANSWER_LAYERS = ["KnowledgeBase", "FAQ", "LLM", "Fallback"] as const;
const FUNNEL_STAGES = ["Visited", "Engaged", "AskedQuestion", "ReceivedAnswer", "Converted"] as const;

function hashString(str: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(...parts: string[]): () => number {
  return mulberry32(hashString(parts.join("|")));
}

/** Splits `total` across weights proportionally, keeping the integer sum exact. */
function weightedSplit(total: number, weights: number[]): number[] {
  const sumWeights = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (total * w) / sumWeights);
  const floors = raw.map(Math.floor);
  const remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((value, i) => ({ i, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < remainder; k++) result[order[k % order.length].i] += 1;
  return result;
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Defaults to the trailing 30 days when `from`/`to` are omitted. */
export function parseDateRange(searchParams: URLSearchParams): DateRange | { error: string } {
  const from = searchParams.get("from") ?? daysAgoIso(29);
  const to = searchParams.get("to") ?? todayIso();

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return { error: "from/to must be dates in YYYY-MM-DD format" };
  }
  if (from > to) {
    return { error: "from must not be after to" };
  }
  const spanDays = (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000;
  if (spanDays > MAX_RANGE_DAYS) {
    return { error: `date range cannot exceed ${MAX_RANGE_DAYS} days` };
  }
  return { from, to };
}

function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

interface DailyFigures {
  date: string;
  visitors: number;
  conversations: number;
  questions: number;
  unanswered: number;
  voice: number;
  text: number;
  newVisitors: number;
  returningVisitors: number;
  dropOffRate: number;
  /** Conversations with >=1 question -- always <= conversations, unlike the raw `questions` count. */
  askedQuestionConversations: number;
  /** Conversations that got an answer -- feeds the funnel, kept distinct from question-level fallback_rate. */
  answeredConversations: number;
  converted: number;
}

function dailyFigures(tenantId: string, date: string): DailyFigures {
  const visitorsRng = rngFor(tenantId, date, "visitors");
  const visitors = 80 + Math.floor(visitorsRng() * 320);

  const engagementRate = 0.4 + rngFor(tenantId, date, "engagement")() * 0.4;
  const conversations = Math.round(visitors * engagementRate);

  const questionsPerConversation = 1 + rngFor(tenantId, date, "qpc")() * 2;
  const questions = Math.round(conversations * questionsPerConversation);

  const fallbackRateDay = 0.05 + rngFor(tenantId, date, "fallback")() * 0.2;
  const unanswered = Math.round(questions * fallbackRateDay);

  const voiceShare = 0.1 + rngFor(tenantId, date, "voice")() * 0.3;
  const voice = Math.round(conversations * voiceShare);
  const text = conversations - voice;

  const newShare = 0.3 + rngFor(tenantId, date, "new-visitor")() * 0.4;
  const newVisitors = Math.round(visitors * newShare);
  const returningVisitors = visitors - newVisitors;

  const dropOffRate = 0.1 + rngFor(tenantId, date, "dropoff")() * 0.3;

  // Funnel stages track conversations (sessions), not raw question counts,
  // so each stage is <= the one before it -- unlike `questions`, which can
  // exceed `conversations` once a session asks more than one question.
  const askShare = 0.85 + rngFor(tenantId, date, "ask-share")() * 0.15;
  const askedQuestionConversations = Math.round(conversations * askShare);
  const answeredConversations = Math.round(askedQuestionConversations * (1 - fallbackRateDay));
  const conversionRate = 0.1 + rngFor(tenantId, date, "conversion")() * 0.2;
  const converted = Math.round(answeredConversations * conversionRate);

  return {
    date,
    visitors,
    conversations,
    questions,
    unanswered,
    voice,
    text,
    newVisitors,
    returningVisitors,
    dropOffRate,
    askedQuestionConversations,
    answeredConversations,
    converted,
  };
}

export function buildAnalyticsResponse(tenantId: string, range: DateRange) {
  const dates = enumerateDates(range.from, range.to);
  const days = dates.map((date) => dailyFigures(tenantId, date));

  const sum = (pick: (d: DailyFigures) => number) => days.reduce((total, d) => total + pick(d), 0);
  const avg = (pick: (d: DailyFigures) => number) => (days.length ? sum(pick) / days.length : 0);

  const totalVisitors = sum((d) => d.visitors);
  const totalConversations = sum((d) => d.conversations);
  const totalQuestions = sum((d) => d.questions);
  const totalUnanswered = sum((d) => d.unanswered);
  const totalAnswered = totalQuestions - totalUnanswered;
  const totalConverted = sum((d) => d.converted);

  // Topic and answer-layer splits are stable per tenant (not per day) so the
  // dashboard doesn't look like it's reshuffling categories every time the
  // date range changes by a day.
  const topicWeights = TOPICS.map((t) => rngFor(tenantId, "topic-weight", t)());
  const topicCounts = weightedSplit(totalQuestions, topicWeights);

  const layerWeights = ANSWER_LAYERS.map((l) => rngFor(tenantId, "layer-weight", l)());
  const layerCounts = weightedSplit(totalAnswered, layerWeights);

  const hourWeights = Array.from({ length: 24 }, (_, hour) => {
    // A rough business-hours curve (peak around midday) plus per-tenant noise.
    const businessHoursCurve = Math.max(0, 1 - Math.abs(hour - 13) / 10);
    return 0.15 + businessHoursCurve + rngFor(tenantId, "hour-weight", String(hour))() * 0.3;
  });
  const hourCounts = weightedSplit(totalConversations, hourWeights);

  const dowWeights = Array.from({ length: 7 }, (_, day) => {
    const isWeekend = day === 0 || day === 6;
    return (isWeekend ? 0.5 : 1) + rngFor(tenantId, "dow-weight", String(day))() * 0.3;
  });
  const dowCounts = weightedSplit(totalConversations, dowWeights);

  // Session-level counts, each <= the stage before it -- unlike `questions`,
  // which counts individual questions and can exceed `conversations`.
  const totalAskedQuestionConversations = sum((d) => d.askedQuestionConversations);
  const totalAnsweredConversations = sum((d) => d.answeredConversations);
  const funnelCounts = [
    totalVisitors,
    totalConversations,
    totalAskedQuestionConversations,
    totalAnsweredConversations,
    totalConverted,
  ];

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const billingDates = enumerateDates(
    periodStart.toISOString().slice(0, 10),
    periodEnd.toISOString().slice(0, 10)
  );
  const billingAnswered = billingDates.reduce((total, date) => {
    const d = dailyFigures(tenantId, date);
    return total + (d.questions - d.unanswered);
  }, 0);
  const perAnswerRate = 0.015 + rngFor(tenantId, "per-answer-rate")() * 0.02;

  return {
    tenant_id: tenantId,
    range: { from: range.from, to: range.to },
    visitors_engaged: totalVisitors,
    conversations_and_questions_by_period: days.map((d) => ({
      date: d.date,
      conversations: d.conversations,
      questions: d.questions,
    })),
    top_questions_by_topic: TOPICS.map((topic, i) => ({
      topic,
      question: SAMPLE_QUESTIONS[topic][hashString(tenantId + topic) % SAMPLE_QUESTIONS[topic].length],
      count: topicCounts[i],
    })),
    unanswered_questions: totalUnanswered,
    fallback_rate: totalQuestions ? totalUnanswered / totalQuestions : 0,
    drop_off: {
      rate: avg((d) => d.dropOffRate),
      by_period: days.map((d) => ({ date: d.date, rate: d.dropOffRate })),
    },
    topic_engagement: TOPICS.map((topic, i) => ({ topic, engagement_count: topicCounts[i] })),
    conversion_funnel: FUNNEL_STAGES.map((stage, i) => ({ stage, count: funnelCounts[i] })),
    voice_text_split: { voice: sum((d) => d.voice), text: sum((d) => d.text) },
    visitor_split: { new: sum((d) => d.newVisitors), returning: sum((d) => d.returningVisitors) },
    answered_by_layer: ANSWER_LAYERS.map((layer, i) => ({ layer, count: layerCounts[i] })),
    time_of_day: hourCounts.map((count, hour) => ({ hour, count })),
    day_of_week: dowCounts.map((count, day) => ({ day, count })),
    current_billing_period: {
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      total_answers: billingAnswered,
      per_answer_rate: Number(perAnswerRate.toFixed(4)),
    },
  };
}

export type AnalyticsResponse = ReturnType<typeof buildAnalyticsResponse>;

export function toCsv(response: AnalyticsResponse): string {
  const header = ["date", "conversations", "questions"];
  const rows = response.conversations_and_questions_by_period.map((row) => [
    row.date,
    String(row.conversations),
    String(row.questions),
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
}
