interface DefaultContext {
	blockchain?: string;
	blockNumber?: string | number;
	channel?: string;
	txHash?: string;
	message?: any;
	executorClass?: string;
	request?: {
		method: string;
		endpoint: string;
		payload?: string;
	};
}
export interface LogEntry<Context = DefaultContext> {
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
