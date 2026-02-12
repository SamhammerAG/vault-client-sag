import { getVault } from "./main";

try {
    // Runs with sagctl per default

    // Comment in these vars to test approle auth
    // process.env["VaultUrl"] = "https://vault.mydomain.de";
    // process.env["VaultAppRoleId"] = "<appRoleId>";
    // process.env["VaultAppRoleSecretId"] = "<appRoleSecretId>";

    const vault = await getVault();
    const logUser = await vault.loadSecret("VaultKey--kv-v2/data/global/logstash/Username");
    console.log("logUser", logUser);
} catch (error) {
    console.log(error);
}
