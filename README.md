# vault-client-sag

This library can be used if you want to load specific keys from vault, but works only for interal usage of Samhammer.

It uses specific authentication logic:

-   Locally: Uses the url and token returned by sagctl
-   Kubernetes: Does a kubernetes role auth

## Prerequirements:

### Locally

Sagctl has to be installed: https://samhammer.atlassian.net/wiki/spaces/K8S/pages/158793743/How+to+use+sagctl

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

## How to publish

-   Increase version by 'yarn version' command on local machine. This updates package.json and creates tag
-   Check github action to validated, that package was released to npm registry.
