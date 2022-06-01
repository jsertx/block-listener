import { NextFunction, Request, Response } from "express";
import { getEnv } from "../../App/Utils/Env";
import { ILogger } from "../../Interfaces/ILogger";

export const ApiTokenAuthMiddleware =
  (logger: ILogger) => (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"];
    if (!token || token !== getEnv("API_TOKEN")) {
      return res.status(401).send({ message: "Invalid token" });
    }
    return next();
  };
