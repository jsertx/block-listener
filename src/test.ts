import { blockchainIdList } from "./App/Values/Blockchain";
import { walletTypeList } from "./App/Values/WalletType";

const Joi = require("joi");

const res = Joi.object({
  address: Joi.string().required(),
  blockchain: Joi.string()
    .valid(...blockchainIdList)
    .required(),
  type: Joi.string()
    .valid(...walletTypeList)
    .required(),
  alias: Joi.string().optional(),
})
  .options({ stripUnknown: true })

  .validate({
    address: "0xAAAA",
    blockchain: "ethereum",
    type: "whale.wallet",
    alias: "A Whale",
    delete: "this",
  });

console.log(res);
