import { beforeAll, describe, expect, it } from "vitest";
import { cloudbedsAdapter } from "./adapters/cloudbeds";
import { manualAdapter } from "./adapters/manual";
import { mewsAdapter } from "./adapters/mews";
import { getAdapter, getRegisteredProviders, registerAdapter } from "./registry";
import type { IntegrationAdapter } from "./types";

const hotelId = "test-hotel";
const range = { from: "2025-01-01", to: "2025-01-07" };

// Do not import `./index` in tests — it loads syncService → Supabase client (browser APIs).
describe("integration adapters", () => {
  beforeAll(() => {
    registerAdapter(mewsAdapter);
    registerAdapter(cloudbedsAdapter);
    registerAdapter(manualAdapter);
  });

  describe("integration registry", () => {
    it("registers mews, cloudbeds, and manual", () => {
      expect(getRegisteredProviders().sort()).toEqual(["cloudbeds", "manual", "mews"]);
    });

    it("returns undefined for unimplemented providers (e.g. opera)", () => {
      expect(getAdapter("opera")).toBeUndefined();
      expect(getAdapter("quickbooks")).toBeUndefined();
    });
  });

  describe("mews adapter", () => {
    let adapter: IntegrationAdapter;

    beforeAll(() => {
      const a = getAdapter("mews");
      if (!a) throw new Error("expected mews adapter to be registered");
      adapter = a;
    });

    it("is registered as pms", () => {
      expect(adapter.provider).toBe("mews");
      expect(adapter.type).toBe("pms");
    });

    it("testConnection fails when tokens are missing", async () => {
      const r = await adapter.testConnection({});
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/Missing accessToken|clientToken/);
    });

    it("testConnection succeeds when tokens are present (stub — no HTTP yet)", async () => {
      const r = await adapter.testConnection({
        accessToken: "x",
        clientToken: "y",
      });
      expect(r.success).toBe(true);
    });

    it("fetchDailyMetrics returns an array", async () => {
      const rows = await adapter.fetchDailyMetrics(
        { accessToken: "x", clientToken: "y" },
        hotelId,
        range.from,
        range.to
      );
      expect(Array.isArray(rows)).toBe(true);
    });

    it("fetchRevenueByChannel returns an array when defined", async () => {
      const rows = await adapter.fetchRevenueByChannel!(
        { accessToken: "x", clientToken: "y" },
        hotelId,
        range.from,
        range.to
      );
      expect(Array.isArray(rows)).toBe(true);
    });
  });

  describe("cloudbeds adapter", () => {
    let adapter: IntegrationAdapter;

    beforeAll(() => {
      const a = getAdapter("cloudbeds");
      if (!a) throw new Error("expected cloudbeds adapter to be registered");
      adapter = a;
    });

    it("testConnection fails without apiKey", async () => {
      const r = await adapter.testConnection({});
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/Missing apiKey/);
    });

    it("testConnection succeeds with apiKey (stub — no HTTP yet)", async () => {
      const r = await adapter.testConnection({ apiKey: "k" });
      expect(r.success).toBe(true);
    });

    it("fetchDailyMetrics and fetchRevenueByChannel return arrays", async () => {
      const creds = { apiKey: "k" };
      const daily = await adapter.fetchDailyMetrics(creds, hotelId, range.from, range.to);
      const ch = await adapter.fetchRevenueByChannel!(creds, hotelId, range.from, range.to);
      expect(Array.isArray(daily)).toBe(true);
      expect(Array.isArray(ch)).toBe(true);
    });
  });

  describe("manual adapter", () => {
    let adapter: IntegrationAdapter;

    beforeAll(() => {
      const a = getAdapter("manual");
      if (!a) throw new Error("expected manual adapter to be registered");
      adapter = a;
    });

    it("testConnection always succeeds", async () => {
      expect((await adapter.testConnection({})).success).toBe(true);
    });

    it("fetchDailyMetrics returns empty (user-entered data)", async () => {
      const rows = await adapter.fetchDailyMetrics({}, hotelId, range.from, range.to);
      expect(rows).toEqual([]);
    });
  });
});
