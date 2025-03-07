import { NextFunction, Request, Response } from "express";
import { ILogger } from "../../../Interfaces/ILogger";
import { ValidationError } from "../Errors/ValidationError";

export const GlobalErrorMiddleware =
	(logger: ILogger) =>
	(error: unknown, req: Request, res: Response, _next: NextFunction) => {
		if (error instanceof ValidationError) {
			const validation = error as ValidationError;
			if (validation.originalError) {
				return res.status(400).send({
					message: "Invalid payload",
					code: "INVALID_PAYLOAD",
					errors: validation.originalError.details
				});
			}
		}

		logger.error({
			error,
			message: "Error processing http request",
			type: "api-request.error",
			context: {
				request: {
					method: req.method,
					endpoint: req.path,
					payload: JSON.stringify(req.body)
				}
			}
		});
		res.status(500).send({ message: "Something went wrong" });
	};
