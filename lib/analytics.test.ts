import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { buildAnalyticsResponse, parseDateRange, toCsv } from "@/lib/analytics";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

const baseDate = () =>
  fc.date({ min: new Date("2020-01-01T00:00:00.000Z"), max: new Date("2029-12-31T00:00:00.000Z") });

describe("parseDateRange", () => {
  it("echoes back any valid from<=to pair within a 366-day span unchanged", () => {
    fc.assert(
      fc.property(baseDate(), fc.integer({ min: 0, max: 366 }), (from, spanDays) => {
        const fromIso = toIsoDate(from);
        const toIso = toIsoDate(addDays(from, spanDays));
        const result = parseDateRange(new URLSearchParams({ from: fromIso, to: toIso }));
        expect(result).toEqual({ from: fromIso, to: toIso });
      })
    );
  });

  it("returns an error when from is after to", () => {
    fc.assert(
      fc.property(baseDate(), fc.integer({ min: 1, max: 100 }), (to, spanDays) => {
        const toIso = toIsoDate(to);
        const fromIso = toIsoDate(addDays(to, spanDays));
        const result = parseDateRange(new URLSearchParams({ from: fromIso, to: toIso }));
        expect(result).toHaveProperty("error");
      })
    );
  });

  it("returns an error when the span exceeds 366 days", () => {
    fc.assert(
      fc.property(baseDate(), fc.integer({ min: 367, max: 2000 }), (from, spanDays) => {
        const fromIso = toIsoDate(from);
        const toIso = toIsoDate(addDays(from, spanDays));
        const result = parseDateRange(new URLSearchParams({ from: fromIso, to: toIso }));
        expect(result).toHaveProperty("error");
      })
    );
  });

  it("returns an error for malformed date strings", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
        (malformed) => {
          const result = parseDateRange(new URLSearchParams({ from: malformed, to: "2026-01-01" }));
          expect(result).toHaveProperty("error");
        }
      )
    );
  });
});

// Ranges are capped at 30 days in these properties (rather than the full
// 366-day maximum) to keep property-test iteration fast; buildAnalyticsResponse
// scales linearly with range length and the invariants below don't depend on
// range size to hold.
const shortRange = () =>
  fc
    .tuple(baseDate(), fc.integer({ min: 0, max: 30 }))
    .map(([from, spanDays]) => ({ from: toIsoDate(from), to: toIsoDate(addDays(from, spanDays)) }));

const tenantId = () => fc.string({ minLength: 1, maxLength: 20 });

describe("buildAnalyticsResponse", () => {
  it("is deterministic for the same tenantId and range", () => {
    fc.assert(
      fc.property(tenantId(), shortRange(), (tid, range) => {
        expect(buildAnalyticsResponse(tid, range)).toEqual(buildAnalyticsResponse(tid, range));
      })
    );
  });

  it("produces a non-increasing conversion funnel", () => {
    fc.assert(
      fc.property(tenantId(), shortRange(), (tid, range) => {
        const { conversion_funnel } = buildAnalyticsResponse(tid, range);
        for (let i = 1; i < conversion_funnel.length; i++) {
          expect(conversion_funnel[i].count).toBeLessThanOrEqual(conversion_funnel[i - 1].count);
        }
      })
    );
  });

  it("splits every conversation into exactly voice or text", () => {
    fc.assert(
      fc.property(tenantId(), shortRange(), (tid, range) => {
        const response = buildAnalyticsResponse(tid, range);
        const totalConversations = response.conversations_and_questions_by_period.reduce(
          (sum, d) => sum + d.conversations,
          0
        );
        expect(response.voice_text_split.voice + response.voice_text_split.text).toBe(totalConversations);
      })
    );
  });

  it("never produces negative counts", () => {
    fc.assert(
      fc.property(tenantId(), shortRange(), (tid, range) => {
        const response = buildAnalyticsResponse(tid, range);
        expect(response.visitors_engaged).toBeGreaterThanOrEqual(0);
        expect(response.unanswered_questions).toBeGreaterThanOrEqual(0);
        for (const stage of response.conversion_funnel) {
          expect(stage.count).toBeGreaterThanOrEqual(0);
        }
      })
    );
  });
});

describe("toCsv", () => {
  it("produces one header row plus one row per data entry, matching source values", () => {
    fc.assert(
      fc.property(tenantId(), shortRange(), (tid, range) => {
        const response = buildAnalyticsResponse(tid, range);
        const csv = toCsv(response);
        const lines = csv.split("\n");
        expect(lines[0]).toBe("date,conversations,questions");
        expect(lines.length).toBe(response.conversations_and_questions_by_period.length + 1);
        response.conversations_and_questions_by_period.forEach((entry, i) => {
          expect(lines[i + 1]).toBe(`${entry.date},${entry.conversations},${entry.questions}`);
        });
      })
    );
  });
});
