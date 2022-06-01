import { interfaces, controller, httpGet } from "inversify-express-utils";
import { IApiResponse } from "../Types/Response";

@controller("/status")
export class StatusController implements interfaces.Controller {
  @httpGet("/")
  index(): IApiResponse<string> {
    return {
      success: true,
      data: "ok",
    };
  }
}
