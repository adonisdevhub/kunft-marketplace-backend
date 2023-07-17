import Joi from 'joi'

export const addToken = {
  body: Joi.object().keys({
    contractPackageHash: Joi.string().required(),
    tokenId: Joi.string().required(),
  }),
}
