import { parseVaultKey } from "../src/parse";

describe("parseVaultKey", () => {
    it("returns ", () => {
        const result = parseVaultKey("VaultKey--kv-v2/data/global/logstash/Username");

        const expected = {
            secretMount: "kv-v2",
            secretPath: "global/logstash",
            secretKey: "Username"
        };

        expect(result).toStrictEqual(expected);
    });
});
