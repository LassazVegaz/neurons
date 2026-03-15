/**
 * Unblock thread in aynsc functions for other tasks
 */
export const unblockThread = () => new Promise<void>((res) => setTimeout(res));
