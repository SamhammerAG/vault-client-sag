import { pathExists, readFile } from "fs-extra";
import type Vault from "hashi-vault-js";

const KubernetesServiceAccountJwtFile = "/var/run/secrets/kubernetes.io/serviceaccount/token";
const EnvironmentVariableNameVaultUrl = "VaultUrl";
const EnvironmentVariableNameKubernetesRole = "VaultKubernetesRole";

const isCluster = async () => {
    return await pathExists(KubernetesServiceAccountJwtFile);
};

const getUrl = async () => {
    return process.env[EnvironmentVariableNameVaultUrl];
};

const getRole = async () => {
    return process.env[EnvironmentVariableNameKubernetesRole];
};

const getJwt = async () => {
    const content = await readFile(KubernetesServiceAccountJwtFile);
    return content.toString();
};

const getToken = async (vault: Vault) => {
    const role = await getRole();
    const jwt = await getJwt();

    const response = await vault.loginWithK8s(role, jwt);
    const result = response as { client_token: string };

    return result.client_token;
};

export default {
    isCluster,
    getUrl,
    getToken
};
