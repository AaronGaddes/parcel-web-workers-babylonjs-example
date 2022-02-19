type RemapHandler = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => number;
export const remap: RemapHandler = (value, inMin, inMax, outMin, outMax) => {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
};
