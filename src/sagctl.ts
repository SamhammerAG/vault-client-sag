import { promisify } from "util";
import { execFile } from "child_process";

export const getToken = async () => {
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("sagctl", ["vault", "get", "token"]);
    const token = stdout.trim();
    return token;
};

export const getUrl = async () => {
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("sagctl", ["vault", "get", "url"]);
    const token = stdout.trim();
    return token;
};
