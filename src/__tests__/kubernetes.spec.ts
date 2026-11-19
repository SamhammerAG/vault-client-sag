import { describe, it, expect, vi } from "vitest";
import { access, readFile } from "node:fs/promises";
import type Vault from "hashi-vault-js";
import kubernetes from "../kubernetes";

// the service account token only exists inside a cluster, so the file system is mocked
vi.mock("node:fs/promises", () => ({
    access: vi.fn(),
    readFile: vi.fn()
}));

const tokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token";

describe("isCluster", () => {
    it("returns true if the service account token exists", async () => {
        vi.mocked(access).mockResolvedValue();

        expect(await kubernetes.isCluster()).toBe(true);
        expect(access).toHaveBeenCalledWith(tokenFile);
    });

    it("returns false if the service account token does not exist", async () => {
        vi.mocked(access).mockRejectedValue(Object.assign(new Error("not found"), { code: "ENOENT" }));

        expect(await kubernetes.isCluster()).toBe(false);
    });
});

describe("getUrl", () => {
    it("returns the url from VaultUrl", async () => {
        vi.stubEnv("VaultUrl", "https://vault.example.com");

        expect(await kubernetes.getUrl()).toBe("https://vault.example.com");
    });
});

describe("getToken", () => {
    const createVault = () => {
        const loginWithK8s = vi.fn().mockResolvedValue({ client_token: "vault-token" });
        return { vault: { loginWithK8s } as unknown as Vault, loginWithK8s };
    };

    it("logs in with the role and the service account token", async () => {
        vi.stubEnv("VaultKubernetesRole", "my-role");
        vi.mocked(readFile).mockResolvedValue(Buffer.from("service-account-jwt"));
        const { vault, loginWithK8s } = createVault();

        const token = await kubernetes.getToken(vault);

        expect(readFile).toHaveBeenCalledWith(tokenFile);
        expect(loginWithK8s).toHaveBeenCalledWith("my-role", "service-account-jwt");
        expect(token).toBe("vault-token");
    });

    it("uses an empty role if VaultKubernetesRole is not set", async () => {
        vi.stubEnv("VaultKubernetesRole", undefined);
        vi.mocked(readFile).mockResolvedValue(Buffer.from("service-account-jwt"));
        const { vault, loginWithK8s } = createVault();

        await kubernetes.getToken(vault);

        expect(loginWithK8s).toHaveBeenCalledWith("", "service-account-jwt");
    });

    it("fails if the service account token cannot be read", async () => {
        vi.mocked(readFile).mockRejectedValue(new Error("EACCES"));
        const { vault, loginWithK8s } = createVault();

        await expect(kubernetes.getToken(vault)).rejects.toThrow("EACCES");
        expect(loginWithK8s).not.toHaveBeenCalled();
    });
});
