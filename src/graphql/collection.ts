import { IResolvers } from '@graphql-tools/utils'

import {
  getCollections,
  getCollectionSlugs,
  getMetadataInfo,
} from '@/services/collection'

export const collectionResolver: IResolvers = {
  Query: {
    async getCollections(_: any, args: any, __: any, ___: any) {
      return await getCollections(args)
    },
    async getCollectionSlugs(_: any, __: any, ___: any, ____: any) {
      const data = await getCollectionSlugs()

      return { data }
    },
    async getMetadataInfo(_: any, args: any, ___: any, ____: any) {
      const { slug } = args
      const data = await getMetadataInfo(slug)
      return { data }
    },
  },
  Mutation: {
    addCollection: async () => {
      return {}
    },
  },
}
