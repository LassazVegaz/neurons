export const getMean = (arr: number[]) =>
  arr.reduce((pre, cur) => pre + cur, 0) / arr.length;

export const getStandardDeviation = (arr: number[]) => {
  const mean = getMean(arr);

  const squareSum = arr.reduce((pre, cur) => pre + (cur - mean) ** 2, 0);

  return Math.sqrt(squareSum / arr.length);
};
