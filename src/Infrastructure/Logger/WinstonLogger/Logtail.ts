import { Logtail } from "@logtail/node";
import { ILogtailLog, LogLevel } from "@logtail/types";
import { LogtailTransport } from "@logtail/winston";
import { flattenObject } from "../../../App/Utils/Misc";
import { ILogtailConfig } from "../../../Interfaces/IConfig";
import { LogEntry } from "../../../Interfaces/ILogger";

export const createLogtailTransport = (config: ILogtailConfig) => {
	return new LogtailTransport(
		new Logtail(config.accessToken, {
			batchSize: 1000,
			batchInterval: 60_000
		})
	);
};

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
