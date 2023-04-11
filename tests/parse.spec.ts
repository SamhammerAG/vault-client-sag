import { parseVaultKey } from "../src/parse";

describe("parseVaultKey", () => {
    it("returns secret with sub-path ", () => {
        const result = parseVaultKey("VaultKey--kv-v2/data/global/logstash/Username");

        const expected = {
            secretMount: "kv-v2",
            secretPath: "global/logstash",
            secretKey: "Username"
        };

        expect(result).toStrictEqual(expected);
    });

    it("returns secret in root-path", () => {
        const result = parseVaultKey("VaultKey--kv-v2/data/logstash/Username");

        const expected = {
            secretMount: "kv-v2",
            secretPath: "logstash",
            secretKey: "Username"
        };

        expect(result).toStrictEqual(expected);
    });

    it("fails for secret without path", () => {
        expect(() => parseVaultKey("VaultKey--kv-v2/data/Username")).toThrowError();
    });

    it("fails for non-secret", () => {
        expect(() => parseVaultKey("xyz")).toThrowError();
    });
});
