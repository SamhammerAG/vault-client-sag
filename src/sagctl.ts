import { promisify } from "util";
import { execFile } from "child_process";

const getToken = async () => {
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("sagctl", ["vault", "get", "token"]);
    const token = stdout.trim();
    return token;
};

const getUrl = async () => {
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("sagctl", ["vault", "get", "url"]);
    const url = stdout.trim();
    return url;
};

export default {
    getToken,
    getUrl
};
