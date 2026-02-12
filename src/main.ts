import Vault from "hashi-vault-js";
import { parseVaultKey } from "./parse";
import sagCtl from "./sagctl";
import kubernetes from "./kubernetes";
import approle from "./approle";
import { AuthMethod } from "./authmethod";
import { getTimeout } from "./utils";

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

            const response = (await this.vault.readKVSecret(this.token, secretPath, undefined, secretMount)) as {
                isVaultError: boolean;
                data: Record<string, string>;
            };

            if (response.isVaultError) {
                throw response;
            }

            if (!(secretKey in response.data)) {
                throw new Error(`key '${secretKey}' not found`);
            }

            return response.data[secretKey] as string;
        } catch (error) {
            if (!error.isVaultError) {
                throw new Error(`unexpected error when accessing secret '${vaultKey}' ${error}`);
            }

            switch (error.status) {
                case 404:
                    throw new Error(`secret '${vaultKey}' not found`);
                case 403:
                    throw new Error(`access denied for secret '${vaultKey}'`);
                default:
                    throw new Error(`unexpected error when accessing secret '${vaultKey}' ${error.vaultHelpMessage}`);
            }
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
    const authMethod = await getAuthMethod();
    const url = await getUrl(authMethod);
    const timeout = getTimeout(params);

    const vault = new Vault({
        https: true,
        baseUrl: `${url}/v1`,
        rootPath: "",
        timeout
    });

    const token = await getToken(authMethod, vault);

    return new VaultClient(vault, token);
};

const getAuthMethod = async () => {
    const isCluster = await kubernetes.isCluster();
    if (isCluster) {
        return AuthMethod.Kubernetes;
    }

    const isAppRole = await approle.isAppRole();
    if (isAppRole) {
        return AuthMethod.AppRole;
    }

    return AuthMethod.Sagctl;
};

const getUrl = async (authMethod: AuthMethod) => {
    let url = "";

    switch (authMethod) {
        case AuthMethod.Kubernetes: {
            url = await kubernetes.getUrl();
            break;
        }
        case AuthMethod.AppRole: {
            url = await approle.getUrl();
            break;
        }
        case AuthMethod.Sagctl: {
            url = await sagCtl.getUrl();
            break;
        }
    }

    return url;
};

const getToken = async (authMethod: AuthMethod, vault: Vault) => {
    let token = "";

    switch (authMethod) {
        case AuthMethod.Kubernetes: {
            token = await kubernetes.getToken(vault);
            break;
        }
        case AuthMethod.AppRole: {
            token = await approle.getToken(vault);
            break;
        }
        case AuthMethod.Sagctl: {
            token = await sagCtl.getToken();
            break;
        }
    }

    return token;
};
export { getTimeout };
