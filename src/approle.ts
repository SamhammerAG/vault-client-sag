import type Vault from "hashi-vault-js";

const EnvironmentVariableNameVaultUrl = "VaultUrl";
const EnvironmentVariableNameVaultRoleId = "VaultAppRoleId";
const EnvironmentVariableNameVaultSecretId = "VaultAppRoleSecretId";

const isAppRole = async () => {
    return process.env[EnvironmentVariableNameVaultRoleId] && process.env[EnvironmentVariableNameVaultSecretId];
};

const getRole = () => {
    return process.env[EnvironmentVariableNameVaultRoleId];
};

const getSecret = () => {
    return process.env[EnvironmentVariableNameVaultSecretId];
};

const getToken = async (vault: Vault) => {
    const role = getRole();
    const secret = getSecret();

    const response = await vault.loginWithAppRole(role, secret);
    const result = response as { client_token: string };

    return result.client_token;
};

const getUrl = async () => {
    return process.env[EnvironmentVariableNameVaultUrl];
};

export default {
    isAppRole,
    getToken,
    getUrl
};
