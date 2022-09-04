import { getEnv } from "../../../App/Utils/Env";
import winston from "winston";
import {
	ErrorLogEntry,
	ILogger,
	LogEntry,
	LogEntryParams
} from "../../../Interfaces/ILogger";
import { inject, injectable } from "inversify";
import { ILogtailLog } from "@logtail/types";
import { IocKey } from "../../../Ioc/IocKey";
import { IConfig } from "../../../Interfaces/IConfig";
import * as Transport from "winston-transport";
import { createLogtailTransport, mapToPaperTrail } from "./Logtail";

const stackErrorMaxLevels = 4;

@injectable()
export class WinstonLoggerClient implements ILogger {
	logger: winston.Logger;
	constructor(@inject(IocKey.Config) private config: IConfig) {
		const transports: Transport[] = [new winston.transports.Console()];
		if (this.config.logtail?.accessToken) {
			transports.push(createLogtailTransport(this.config.logtail));
		}
		this.logger = winston.createLogger({
			format: winston.format.json(),
			defaultMeta: {
				app: getEnv("APP_NAME"),
				id: getEnv("HOSTNAME", getEnv("APP_NAME"))
			},
			transports
		});
	}
	log(entry: LogEntryParams) {
		this.logger.info(
			this.prepareEntry(
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
			this.prepareEntry(
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
			this.prepareEntry(
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
			this.prepareEntry(
				{
					success: false,
					...entry
				},
				{ level: "error" }
			)
		);
	}

	private normalizeEntryError(error: any) {
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
	}

	private prepareEntry(
		entryParams: LogEntryParams,
		{ level }: Pick<LogEntry, "level">
	): ILogtailLog {
		const entry: LogEntry = {
			...entryParams,
			time: new Date(),
			level
		};
		if (entry.error) {
			entry.error = this.normalizeEntryError(entry.error);
		}

		return mapToPaperTrail(entry);
	}
}
