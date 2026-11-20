import { describe, it, expect, vi } from "vitest";
import { getTimeout } from "../utils";

describe("getTimeout", () => {
    it("returns default value", () => {
        const timeout = getTimeout();
        expect(timeout).toEqual(3000);
    });

    it("returns param value 0", () => {
        const timeout = getTimeout({ timeout: 0 });
        expect(timeout).toEqual(0);
    });

    it("returns param value 1000", () => {
        const timeout = getTimeout({ timeout: 1000 });
        expect(timeout).toEqual(1000);
    });

    it("returns param value instead of env value", () => {
        vi.stubEnv("VaultTimeout", "2000");

        const timeout = getTimeout({ timeout: 1000 });
        expect(timeout).toEqual(1000);
    });

    it("returns env value 0", () => {
        vi.stubEnv("VaultTimeout", "0");

        const timeout = getTimeout();
        expect(timeout).toEqual(0);
    });

    it("returns env value 1000", () => {
        vi.stubEnv("VaultTimeout", "1000");

        const timeout = getTimeout();
        expect(timeout).toEqual(1000);
    });
});
