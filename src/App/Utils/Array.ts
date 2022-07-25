export const onlyUniqueFilter = (value: any, index: number, self: any[]) =>
  self.indexOf(value) === index;

export const flattenReducer = (all: any[], txs: any[]) => [
  ...(all || []),
  ...txs,
];
