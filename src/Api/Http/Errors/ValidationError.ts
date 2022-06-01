import Joi from "joi";

export class ValidationError extends Error {
  constructor(public originalError: Joi.ValidationError) {
    super(`[ValidationError] ${originalError.message}`);
  }
}
