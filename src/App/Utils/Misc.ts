export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const isUndefined = (value: any) =>
	typeof value === "undefined" || value === undefined;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};
