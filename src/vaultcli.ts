import { promisify } from "util";
import { execFile } from "child_process";

const EnvironmentVariableNameVaultAddr = "VAULT_ADDR";

const getToken = async () => {
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("vault", ["print", "token"]);
    const token = stdout.trim();
    return token;
};

const getUrl = async () => {
    return process.env[EnvironmentVariableNameVaultAddr];
};

export default {
    getToken,
    getUrl
};
