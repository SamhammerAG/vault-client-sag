export function parseVaultKey(vaultKey: string, prefix = "VaultKey--") {
    const vaultStr = vaultKey.replace(prefix, "").replace("kv-v2/data/", "");

    const parts = vaultStr.split("/");
    const key = parts.pop();
    const path = parts.join("/");

    return {
        secretMount: "kv-v2",
        secretPath: path,
        secretKey: key
    };
}
