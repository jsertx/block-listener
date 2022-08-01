import { MongoClient, ServerApiVersion } from "mongodb";

export const createConnection = (connectionUri: string) => {
	return new MongoClient(connectionUri, {
		serverApi: ServerApiVersion.v1
	}).connect();
};
