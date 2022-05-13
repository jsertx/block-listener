import { interfaces, controller, httpGet } from "inversify-express-utils";

@controller("/status")
export class FooController implements interfaces.Controller {
  @httpGet("/")
  index(): string {
    return "ok";
  }
}
