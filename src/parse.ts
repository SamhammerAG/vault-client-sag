export function parseVaultKey(vaultKey: string) {
    const regex = /(VaultKey--)(kv-v2)\/(data)\/(?<path>.*\/)(?<key>.*)/;

    const match = vaultKey.match(regex);

    if (!match) {
        throw new Error("VaultKey not valid: " + vaultKey);
    }

    const secretPath = trimEnd(match.groups["path"]);
    const secretKey = trimEnd(match.groups["key"]);

    return {
        secretMount: "kv-v2",
        secretPath,
        secretKey
    };
}

function trimEnd(value: string, char = "/") {
    if (!value) return "";
    return value.endsWith(char) ? value.slice(0, -1) : value;
}
