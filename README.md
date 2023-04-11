# vault-client-sag

This library can be used if you want to load specific keys from vault.

This libary is for internal usage only, as it uses specific authentication logic that only works for Samhammer.

Locally: Uses the url and token returned by sagctl
Kubernetes: Does a kubernetes role auth

## Prerequirements:

### Locally

Sagctl has to be installed: https://samhammer.atlassian.net/wiki/spaces/K8S/pages/158793743/How+to+use+sagctl

### In the cluster

Use following environment variables for configuration:
* VaultUrl: With the url to vault (required)
* VaultKubernetesRole: The vault role of the application (required)

## How to add:

- add this package to package.json of your project: https://www.npmjs.com/package/@samhammer/vault-client-sag

## How to use:

```js
const { getVault } = require("vault-client");

const vaultMap = {
  [`VaultKey--kv-v2/data/MySecret/Username`]: "UserName",
  [`VaultKey--kv-v2/data/MySecret/Password`]: "Password",
};

getVault()
  .then(vault => vault.loadSecretsToEnv(vaultMap));
  .then(() => console.log(`Username: ${process.env.UserName} Password: ${process.env.Password}`);
```

```ts
import { getVault } from "vault-client";

const vaultMap = {
  [`VaultKey--kv-v2/data/MySecret/Username`]: "UserName",
  [`VaultKey--kv-v2/data/MySecret/Password`]: "Password",
};

const vault = await getVault();
await vault.loadSecretsToEnv(vaultMap);
console.log(`Username: ${process.env.UserName} Password: ${process.env.Password}`);
```
