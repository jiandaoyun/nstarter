
export const sleep = async (timeMs: number) =>
    new Promise((r) => setTimeout(r, timeMs));
