import "reflect-metadata";
import "dotenv/config";
import { container } from "./Ioc/container";
import { BlockListener } from "./UseCases/BlockListener";
import { FindDirectTx } from "./UseCases/FindDirectTx";
import { SaveTransaction } from "./UseCases/SaveTransaction";

container.get(FindDirectTx).execute();
container.get(SaveTransaction).execute();
container.get(BlockListener).execute();
