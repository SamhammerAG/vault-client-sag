import type { VaultParams } from "./main";

export const getTimeout = (params?: VaultParams) => {
    if (params?.timeout !== undefined) {
        return params.timeout;
    }

    if (process.env.VaultTimeout) {
        return Number.parseInt(process.env.VaultTimeout);
    }

    return 3000;
};
