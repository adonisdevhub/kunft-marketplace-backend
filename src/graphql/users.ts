import { IResolvers } from '@graphql-tools/utils'

import { userServices } from '@/services'
export const userResolver: IResolvers = {
  Query: {
    async getUserInfo(_: any, args: any) {
      const { where } = args
      return userServices.getUserInfo(where)
    },
  },
}
