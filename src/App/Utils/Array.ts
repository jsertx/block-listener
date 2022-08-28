export const onlyUniqueFilter = (value: any, index: number, self: any[]) =>
	self.indexOf(value) === index;

export const flattenReducer = (all: any[], txs: any[]) => [
	...(all || []),
	...txs
];

export const notUndefined = <T>(x: T | undefined): x is T => {
	return x !== undefined;
};
