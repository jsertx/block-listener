export interface LogEntry<Context = any> {
	message?: string;
	level: "info" | "debug" | "warn" | "error";
	type: string;
	time: Date;
	success?: boolean;
	error?: any;

	context?: Context;
}
export type ErrorLogEntry = LogEntryParams; //& Required<Pick<LogEntryParams, "error">>;
export type LogEntryParams = Omit<LogEntry, "level" | "time">;

export interface ILogger {
	log(entry: LogEntryParams): void;
	debug(entry: LogEntryParams): void;
	warn(entry: LogEntryParams): void;
	error(entry: ErrorLogEntry): void;
}
