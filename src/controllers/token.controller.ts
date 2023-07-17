import express from 'express'
import Joi from 'joi'

import { tokenValidation } from '@/validations'

import {
  addUserToken as _addUserToken,
  getSalesInfo as getSalesInfo,
  getTokens as _getTokens,
} from '@/services/token'

import catchAsync from '@/utils/catchAsync'

export const getTokens = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { collection } = req.params
    // const { page, limit } = req.query

    const tokens = await _getTokens({
      where: {
        slug: collection,
      },
      page: 1,
      limit: 20,
    })
    res.json(tokens)
  },
)

export const addUserToken = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { accountHash } = req.params
    const result = await _addUserToken(accountHash)
    res.json({ result: `${result} tokens added` })
  },
)

export const getHighestSalesInfo = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { slug, tokenId } = Joi.attempt(
      req.query,
      tokenValidation.getHighestSalesInfo,
    )
    console.log(slug, tokenId)
    const result = await getSalesInfo(slug, tokenId)
    res.json({ result })
  },
)
