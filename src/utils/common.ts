export const MODE_AVERAGE_BLOCK_TIME = 2000; // 2s

export function ms2sec(ms: number): number {
  return Math.floor(ms / 1000);
}

export function sec2ms(sec: number): number {
  return sec * 1000;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
