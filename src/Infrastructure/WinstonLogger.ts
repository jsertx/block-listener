import { getEnv } from "../App/Utils/Env";
import winston from "winston";
import {
	ErrorLogEntry,
	ILogger,
	LogEntry,
	LogEntryParams
} from "../Interfaces/ILogger";
import { injectable } from "inversify";

const normalizeEntryError = (error: any) => {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack
		};
	}

	return error;
};

const prepareEntry = (
	entryParams: LogEntryParams,
	{ level }: Pick<LogEntry, "level">
): LogEntry => {
	const entry: LogEntry = {
		...entryParams,
		time: new Date(),
		level
	};
	if (entry.error) {
		entry.error = normalizeEntryError(entry.error);
	}

	return entry;
};

@injectable()
export class WinstonLogger implements ILogger {
	logger: winston.Logger;
	constructor() {
		this.logger = winston.createLogger({
			format: winston.format.json(),
			defaultMeta: {
				app: getEnv("APP_NAME"),
				id: getEnv("HOSTNAME", getEnv("APP_NAME"))
			},
			transports: [new winston.transports.Console()]
		});
	}
	log(entry: LogEntryParams) {
		this.logger.info(
			prepareEntry(
				{
					success: true,
					...entry
				},
				{ level: "info" }
			)
		);
	}
	debug(entry: LogEntryParams) {
		this.logger.debug(
			prepareEntry(
				{
					success: true,
					...entry
				},
				{ level: "debug" }
			)
		);
	}
	warn(entry: LogEntryParams) {
		this.logger.warn(
			prepareEntry(
				{
					success: true,
					...entry
				},
				{ level: "warn" }
			)
		);
	}

	error(entry: ErrorLogEntry) {
		this.logger.error(
			prepareEntry(
				{
					success: false,
					...entry
				},
				{ level: "error" }
			)
		);
	}
}
