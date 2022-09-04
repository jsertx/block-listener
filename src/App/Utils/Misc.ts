export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const isUndefined = (value: any) =>
	typeof value === "undefined" || value === undefined;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const flattenObject = (
	a: Record<string, any>,
	prefix = "context",
	obj: any = {}
): Record<string, any> => {
	return Object.entries(a).reduce((_obj, [_key, _value]) => {
		const key = prefix === "" ? _key : `${prefix}.${_key}`;
		if (_value.toString() === "[object Object]") {
			return {
				...obj,
				...flattenObject(_value, key, _obj)
			};
		}

		return {
			..._obj,
			[key]: _value
		};
	}, obj);
};
