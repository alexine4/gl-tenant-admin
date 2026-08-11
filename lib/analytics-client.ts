export interface AnalyticsResponse {
  tenant_id: string;
  range: { from: string; to: string };
  visitors_engaged: number;
  conversations_and_questions_by_period: { date: string; conversations: number; questions: number }[];
  top_questions_by_topic: { topic: string; question: string; count: number }[];
  unanswered_questions: number;
  fallback_rate: number;
  drop_off: { rate: number; by_period: { date: string; rate: number }[] };
  topic_engagement: { topic: string; engagement_count: number }[];
  conversion_funnel: { stage: string; count: number }[];
  voice_text_split: { voice: number; text: number };
  visitor_split: { new: number; returning: number };
  answered_by_layer: { layer: string; count: number }[];
  time_of_day: { hour: number; count: number }[];
  day_of_week: { day: number; count: number }[];
  current_billing_period: {
    period_start: string;
    period_end: string;
    total_answers: number;
    per_answer_rate: number;
  };
}

export async function readJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body?.error === "string" ? body.error : "Request failed";
    throw new Error(message);
  }
  return body;
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
