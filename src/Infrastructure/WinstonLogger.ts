import { getEnv } from "../App/Utils/Env";
import winston from "winston";
import {
	ErrorLogEntry,
	ILogger,
	LogEntry,
	LogEntryParams
} from "../Interfaces/ILogger";
import { injectable } from "inversify";
import { ILogtailLog, LogLevel } from "@logtail/types";

function flattenObject(
	a: Record<string, any>,
	prefix = "context",
	obj: any = {}
): Record<string, any> {
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
}

export const mapToPaperTrail = ({
	time,
	level,
	message,
	context,
	type
}: LogEntry): ILogtailLog => {
	const entry: ILogtailLog = {
		dt: time,
		level: level as LogLevel,
		message,
		type,
		...flattenObject(context || {})
	};
	return entry;
};
const stackErrorMaxLevels = 4;
const normalizeEntryError = (error: any) => {
	if (error instanceof Error) {
		const stack = [];
		const lines = error.stack?.split("\n") || [];
		while (stack.length < stackErrorMaxLevels && lines.length > 0) {
			stack.push(lines.pop());
		}
		return {
			name: error.name,
			message: error.message
			//stack
		};
	}

	return error;
};
const prepareEntry = (
	entryParams: LogEntryParams,
	{ level }: Pick<LogEntry, "level">
): ILogtailLog => {
	const entry: LogEntry = {
		...entryParams,
		time: new Date(),
		level
	};
	if (entry.error) {
		entry.error = normalizeEntryError(entry.error);
	}

	return mapToPaperTrail(entry);
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
