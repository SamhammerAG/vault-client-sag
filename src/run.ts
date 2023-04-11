import { getVault } from "./main";

try {
    const vault = await getVault();
    const logUser = await vault.loadSecret("VaultKey--kv-v2/data/global/logstash/Username");
    console.log("logUser", logUser);
} catch (error) {
    console.log(error);
}
