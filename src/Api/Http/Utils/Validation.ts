import Joi from "joi";
import { ValidationError } from "../Errors/ValidationError";

export const validateOrThrowError = <T = any>(
	_value: T,
	schema: Joi.Schema
): T => {
	const { error, value } = schema.validate(_value);
	if (error) {
		throw new ValidationError(error);
	}
	return value;
};
