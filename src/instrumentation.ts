export async function register() {
  // Polyfill Math.sumPrecise for Node runtime compatibility
  if (typeof (Math as any).sumPrecise !== "function") {
    (Math as any).sumPrecise = function (items: Iterable<number>) {
      let sum = 0;
      for (const item of items) {
        sum += Number(item);
      }
      return sum;
    };
  }
}
