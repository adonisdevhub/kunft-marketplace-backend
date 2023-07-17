import { IResolvers } from '@graphql-tools/utils'
import GraphQLDate from 'graphql-date'
// @ts-ignore
import GraphQLLong from 'graphql-type-long'

import { favoriteToken, getHighestSalesInfo, getTokens } from '@/services/token'

export const tokenResolver: IResolvers = {
  Query: {
    async getTokens(_: any, args: any) {
      const { where, page, limit } = args

      return await getTokens({ where, page, limit })
    },
    async getHighestSalesInfo(_: any, args: any) {
      const { slug, tokenId } = args.where
      const result = await getHighestSalesInfo(slug, tokenId)
      return { result }
    },
  },
  Mutation: {
    async addToken(_: any, __: any) {
      throw Error('Not Implemented')
      // const { contractHash, tokenId } = args
      // const token = await addToken(contractHash, tokenId)
      // return { token }
    },
    async favoriteToken(_: any, args: any, ctx: any) {
      const { slug, tokenId, publicKey } = args
      console.log(ctx.user)
      const token = await favoriteToken(slug, tokenId, publicKey)
      return { token }
    },
  },
  GraphQLDate,
  GraphQLLong,
}
