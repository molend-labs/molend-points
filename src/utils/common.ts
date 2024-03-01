export const MODE_AVERAGE_BLOCK_TIME = 2000; // 2s

export function ms2sec(ms: number): number {
  return Math.floor(ms / 1000);
}

export function sec2ms(sec: number): number {
  return sec * 1000;
}

export function isUint(n: string): boolean {
  return /^\d+$/.test(n);
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function batchFetches<T>(fetches: (() => Promise<T>)[], batchSize = 10): Promise<T[]> {
  fetches = Array.from(fetches);
  const result: T[] = [];
  while (fetches.length > 0) {
    const slice = fetches.splice(0, batchSize).map((fetch) => fetch());
    const batchResult = await Promise.all(slice);
    result.push(...batchResult);
  }
  return result;
}
