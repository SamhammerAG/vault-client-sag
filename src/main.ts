import type { ErrorResponse } from "hashi-vault-js";
import Vault from "hashi-vault-js";
import { parseVaultKey } from "./parse";
import sagCtl from "./sagctl";
import kubernetes from "./kubernetes";

class VaultClient {
    private vault: Vault;
    private token: string;

    public constructor(vault: Vault, token: string) {
        this.vault = vault;
        this.token = token;
    }

    public async loadSecret(vaultKey: string) {
        try {
            const { secretMount, secretPath, secretKey } = parseVaultKey(vaultKey);

            const response = await this.vault.readKVSecret(this.token, secretPath, undefined, secretMount);
            const result = response as { data: Record<string, unknown> };
            const errorResult = response as ErrorResponse;

            if (errorResult.isVaultError) {
                throw errorResult;
            }

            if (!(secretKey in result.data)) {
                throw new Error(`key '${secretKey}' not found`);
            }

            const value = result.data[secretKey];
            return value as string;
        } catch (error) {
            const errorResult = error as ErrorResponse;
            const status = errorResult.response?.status;

            if (status == 404) {
                throw new Error(`secret '${vaultKey}' not found`);
            } else if (status == 403) {
                throw new Error(`access denied for secret '${vaultKey}'`);
            }

            throw new Error([`unexpected error when accessing secret '${vaultKey}`, errorResult.vaultHelpMessage || error].join(" "));
        }
    }

    public async loadSecretsToEnv(secretMap: Record<string, string>) {
        for (const vaultKey in secretMap) {
            const envKey = secretMap[vaultKey];
            const secretValue = await this.loadSecret(vaultKey);
            process.env[envKey] = secretValue;
        }
    }
}

export interface VaultParams {
    timeout?: number;
}

export const getVault = async (params?: VaultParams) => {
    const isCluster = await kubernetes.isCluster();
    const url = isCluster ? await kubernetes.getUrl() : await sagCtl.getUrl();

    const vault = new Vault({
        https: true,
        baseUrl: `${url}/v1`,
        rootPath: "",
        timeout: params?.timeout ?? 3000
    });

    const token = isCluster ? await kubernetes.getToken(vault) : await sagCtl.getToken();

    return new VaultClient(vault, token);
};
