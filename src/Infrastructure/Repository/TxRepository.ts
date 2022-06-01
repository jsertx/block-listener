import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";
import { Tx, TxRaw } from "../../Domain/Entities/Tx";
import { IConfig } from "../../Interfaces/IConfig";
import { ITxRepository } from "../../Domain/Repository/ITxRepository";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";

@injectable()
export class TxRepository
  extends MongoBaseRepository<TxRaw<any>, Tx<any>>
  implements ITxRepository
{
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("tx", client, config);
  }

  protected getMatchCriteriaFromEntity(
    tx: Tx<any>
  ): PartialObjectDeep<TxRaw<any>> {
    const { hash, blockchain } = tx.toRaw();
    return { blockchain, hash };
  }

  protected modelToEntityMapper(model: WithId<TxRaw<any>>): Tx<any> {
    return new Tx(model, model._id.toString());
  }
}
