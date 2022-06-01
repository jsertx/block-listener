import Joi from "joi";
import { ValidationError } from "../Errors/ValidationError";

export const validateOrThrowError = (value: any, schema: Joi.Schema) => {
  const { error } = schema.validate(value);
  if (error) {
    throw new ValidationError(error);
  }
};
