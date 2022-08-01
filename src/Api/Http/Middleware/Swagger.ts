import * as swagger from "swagger-express-ts";
import * as express from "express";

export const setupSwagger = (app: express.Application) => {
	app.use("/api-docs/swagger", express.static("swagger"));
	app.use(
		"/api-docs/swagger/assets",
		express.static("node_modules/swagger-ui-dist")
	);

	app.use(
		swagger.express({
			definition: {
				info: {
					title: "Blockchain Data API",
					version: "1.0"
				}
			}
		})
	);
};
