import { getVault } from "./main";

// No top-level await: the runner is built as CommonJS, like the published dist/index.js
const run = async () => {
    try {
        // Runs with vault-cli per default (requires `vault login` beforehand and VAULT_ADDR set)

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
};

void run();
