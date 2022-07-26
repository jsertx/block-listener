import { inject, injectable } from "inversify";
import { MongoClient, WithId } from "mongodb";

import { IConfig } from "../../Interfaces/IConfig";
import { IocKey } from "../../Ioc/IocKey";
import { MongoBaseRepository } from "./MongoBaseRepository";
import { PartialObjectDeep } from "type-fest/source/partial-deep";

import { BlockchainId } from "../../App/Values/Blockchain";
import { Token, TokenProps } from "../../App/Entities/Token";
import { ITokenRepository } from "../../App/Repository/ITokenRepository";

@injectable()
export class TokenRepository
  extends MongoBaseRepository<TokenProps, Token>
  implements ITokenRepository
{
  constructor(
    @inject(IocKey.DbClient) client: MongoClient,
    @inject(IocKey.Config) config: IConfig
  ) {
    super("tokens", client, config);
  }

  protected getMatchCriteriaFromEntity(
    token: Token
  ): PartialObjectDeep<TokenProps> {
    const { blockchain, address } = token.toRaw();
    return { blockchain, address };
  }

  protected modelToEntityMapper(model: WithId<TokenProps>): Token {
    return new Token(model, model._id.toString());
  }

  async findPairBaseTokensWhere(
    filters: Partial<TokenProps>
  ): Promise<Token[]> {
    return this.getCollection()
      .find({
        ...filters,
        useAsBaseForPairDiscovery: true,
      })
      .toArray()
      .then((res) => res.map(this.modelToEntityMapper));
  }
}
