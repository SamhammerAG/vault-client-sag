import { promisify } from "util";
import { execFile } from "child_process";
import type Vault from "hashi-vault-js";

const EnvironmentVariableNameVaultAddr = "VAULT_ADDR";

const getUrl = async () => {
    return process.env[EnvironmentVariableNameVaultAddr];
};

const getToken = async (vault: Vault) => {
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("vault", ["print", "token"]);
    const token = stdout.trim();

    await verifyToken(vault, token);

    return token;
};

const verifyToken = async (vault: Vault, token: string) => {
    try {
        const response = (await vault.lookupSelfToken(token)) as {
            isVaultError: boolean;
        };

        if (response.isVaultError) {
            throw response;
        }
    } catch (error) {
        if (!error.isVaultError) {
            throw new Error(`unexpected error when validating vault connection ${error}`);
        }

        switch (error.status) {
            case 403:
                throw new Error("vault connection invalid: token expired or access denied - run 'vault login'");
            default:
                throw new Error(`unexpected error when validating vault connection ${error.vaultHelpMessage}`);
        }
    }
};

export default {
    getToken,
    getUrl
};
