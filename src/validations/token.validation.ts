import Joi from 'joi'

export const getHighestSalesInfo = Joi.object().keys({
  slug: Joi.string().required(),
  tokenId: Joi.string().required(),
})
