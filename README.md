# vault-client-sag

This library can be used if you want to load specific keys from vault, but works only for interal usage of Samhammer.

It uses specific authentication logic:

-   Locally: Uses the token from vault-cli and the url from the `VAULT_ADDR` environment variable
-   Kubernetes: Does a kubernetes role auth

## Prerequirements:

### Locally

The vault-cli has to be installed: https://developer.hashicorp.com/vault/docs/commands

Before using this library you have to log in and set the vault address:

-   `VAULT_ADDR`: The url to vault (e.g. `export VAULT_ADDR=https://vault.mydomain.de`)
-   Run `vault login` (the library then reads the token via `vault print token`)

### In the cluster

Use following environment variables for this configuration:

-   VaultUrl: With the url to vault (required)
-   VaultKubernetesRole: The vault role of the application (required)

### With AppRole (e.g. for github actions)

Use following environment variables for this configuration:

-   VaultUrl: With the url to vault (required)
-   VaultAppRoleId: The vault role id of the application (required)
-   VaultAppRoleSecretId: The vault secret id (password) of the application (required)

## How to add:

-   add this package to package.json of your project: https://www.npmjs.com/package/@samhammer/vault-client-sag

## How to use:

Sample with Javascript:

```js
const { getVault } = require("@samhammer/vault-client-sag");

const vaultMap = {
  [`VaultKey--kv-v2/data/MySecret/Username`]: "UserName",
  [`VaultKey--kv-v2/data/MySecret/Password`]: "Password",
};

getVault()
  .then(vault => vault.loadSecretsToEnv(vaultMap));
  .then(() => console.log(`Username: ${process.env.UserName} Password: ${process.env.Password}`);
```

Sample with Typescript:

```ts
import { getVault } from "@samhammer/vault-client-sag";

const vaultMap = {
    [`VaultKey--kv-v2/data/MySecret/Username`]: "UserName",
    [`VaultKey--kv-v2/data/MySecret/Password`]: "Password"
};

const vault = await getVault();
await vault.loadSecretsToEnv(vaultMap);
console.log(`Username: ${process.env.UserName} Password: ${process.env.Password}`);
```

## Configuration:

Available Options:

-   Timeout in milliseconds (default: 3000 )
    -   as param `getVault({ timeout: 5000 })`
    -   as env variable `VaultTimeout = 5000`

## How to publish

-   Create & Push a tag with new version number
-   The CICD actions will take this version number for npm package automatically
-   Check github action to validated, that package was released to npm registry.
