import { MongoClient, ServerApiVersion } from "mongodb";

export const createConnection = async (connectionUri: string) => {
	const client = await new MongoClient(connectionUri, {
		serverApi: ServerApiVersion.v1
	}).connect();
	process.on("SIGINT", async () => {
		await client.close();
	});
	return client;
};
