import axios from 'axios'
import { CEP47Client } from 'casper-cep47-js-client'
import { CasperClient } from 'casper-js-sdk'
import { StatusCodes } from 'http-status-codes'
import forIn from 'lodash/forIn'
import random from 'lodash/random'
import { PipelineStage } from 'mongoose'

import { Collection, Offer, Sale, Token, User } from '@/models'

import { ApiError } from '@/utils'

import { getCollectionOrCreate } from './collection'
import {
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
} from '../config'

import { MakeServices } from '@/types'
import { TokensByContractPackageHashResponse } from '@/types/make-services'

import { CollectionDocument, TokenDocument } from '@/interfaces/mongoose.gen'
import { getContractHashFromContractPackageHash } from '@/web3/utils'

interface MetadataInput {
  [key: string]: string[]
}

interface PriceInput {
  payToken: string
  min: string
  max: string
}

interface GetTokensInput {
  slug?: string
  owner?: string
  tokenId?: string
  promoted?: boolean
  listed?: boolean
  metadata?: MetadataInput
  price?: PriceInput
}

interface Metadata {
  [key: string]: string | number
}

export const getTokens = async ({
  where,
  page = 1,
  limit = 20,
}: {
  where: GetTokensInput
  page?: number
  limit?: number
}) => {
  const { slug, owner, promoted, tokenId, listed, metadata, price } = where

  let pipeline: PipelineStage[] = []

  if (slug || tokenId) {
    const collectionDB = await Collection.findOne({ slug })

    if (collectionDB === null) throw Error(`Not exist ${slug}`)

    pipeline.push({
      $match: {
        collectionNFT: collectionDB._id,
      },
    })
    if (tokenId) {
      const client = new CEP47Client(
        NEXT_PUBLIC_CASPER_NODE_ADDRESS,
        NEXT_PUBLIC_CASPER_CHAIN_NAME,
      )
      const casperClient = new CasperClient(NEXT_PUBLIC_CASPER_NODE_ADDRESS)
      const contractHash = await getContractHashFromContractPackageHash(
        casperClient,
        collectionDB.contractPackageHash,
      )
      client.setContractHash(`hash-${contractHash}`)

      const owner = await client.getOwnerOf(tokenId)
      await Token.findOneAndUpdate(
        {
          collectionNFT: collectionDB._id,
          tokenId,
        },
        {
          owner: owner.slice(13),
          $inc: {
            viewed: 1,
          },
        },
      )
      pipeline.push({
        $match: {
          tokenId,
        },
      })
    }
  }
  if (promoted) {
    const collectionDBs = await Collection.find({ promoted })
    if (collectionDBs.length > 0) {
      const index = random(0, collectionDBs.length - 1)

      pipeline.push({
        $match: {
          collectionNFT: collectionDBs[index]._id,
        },
      })
    }
  }

  if (owner) {
    pipeline.push({
      $match: {
        owner,
      },
    })
    // let page = 1
    // const limit = 10
    // do {
    //   const { data } = await axios.get<MakeServices.TokensByOwnerResponse>(
    //     `https://event-store-api-clarity-testnet.make.services/accounts/2642243a3ca1abc6f1b5ad3c9f53114955533ffe1a9e76055d1f987370d1d8e0/nft-tokens?fields=contract_package&page=${page}&limit=${limit}`,
    //   )
    //   if (data.pageCount === page) break
    //   page += 1
    // } while (true)
    //
  }
  if (metadata) {
    let subQueries: any[] = []
    forIn(metadata, (values, key) => {
      const subQuery: any[] = []
      values.forEach((value) => {
        subQuery.push({
          [`metadata.${key}`]: value,
        })
      })
      subQueries = subQueries.concat(subQuery)
    })

    pipeline.push({
      $match: {
        $or: subQueries,
      },
    })
  }
  const basePipeline: PipelineStage[] = [
    {
      $lookup: {
        from: 'collections',
        localField: 'collectionNFT',
        foreignField: '_id',
        as: 'collection',
        pipeline: [
          {
            $project: {
              _id: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $set: {
        collection: { $first: '$collection' },
      },
    },
    {
      $lookup: {
        from: 'sales',
        localField: '_id',
        foreignField: 'token',
        as: 'sales',
        pipeline: [
          {
            $project: {
              _id: 0,
              __v: 0,
              token: 0,
            },
          },
          { $sort: { createdAt: -1 } },
        ],
      },
    },
    {
      $set: {
        listed: {
          $in: ['pending', '$sales.status'],
        },
      },
    },
    {
      $set: {
        price: {
          $cond: {
            if: {
              $eq: [
                {
                  $size: '$sales',
                },
                0,
              ],
            },
            then: null,
            else: {
              $let: {
                vars: {
                  sale: {
                    $arrayElemAt: ['$sales', 0],
                  },
                },
                in: {
                  price: '$$sale.price',
                  payToken: '$$sale.payToken',
                },
              },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'offers',
        localField: '_id',
        foreignField: 'token',
        as: 'offers',
        pipeline: [
          {
            $project: {
              _id: 0,
              __v: 0,
              token: 0,
            },
          },
          { $sort: { createdAt: -1 } },
        ],
      },
    },

    {
      $project: {
        _id: 0,
        __v: 0,
        collectionNFT: 0,
      },
    },
  ]
  pipeline = pipeline.concat(basePipeline)

  if (listed !== undefined) {
    pipeline.push({
      $match: {
        listed,
      },
    })
  }

  if (price) {
    const query: PipelineStage = {
      $match: {
        $expr: {
          $and: [
            {
              $cond: {
                if: {
                  $or: [
                    {
                      $eq: [
                        {
                          $cmp: [
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $eq: ['$price', null],
                                    },
                                    {
                                      $eq: ['$price.price', null],
                                    },
                                  ],
                                },
                                then: 0,
                                else: {
                                  $strLenCP: '$price.price',
                                },
                              },
                            },
                            price.min.length,
                          ],
                        },
                        1,
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: [
                            {
                              $cmp: [
                                {
                                  $cond: {
                                    if: {
                                      $or: [
                                        {
                                          $eq: ['$price', null],
                                        },
                                        {
                                          $eq: ['$price.price', null],
                                        },
                                      ],
                                    },
                                    then: 0,
                                    else: {
                                      $strLenCP: '$price.price',
                                    },
                                  },
                                },
                                price.min.length,
                              ],
                            },
                            0,
                          ],
                        },
                        {
                          $ne: [
                            {
                              $cmp: ['$price.price', price.min],
                            },
                            -1,
                          ],
                        },
                      ],
                    },
                  ],
                },
                then: true,
                else: false,
              },
            },
            {
              $cond: {
                if: {
                  $or: [
                    {
                      $eq: [
                        {
                          $cmp: [
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $eq: ['$price', null],
                                    },
                                    {
                                      $eq: ['$price.price', null],
                                    },
                                  ],
                                },
                                then: 0,
                                else: {
                                  $strLenCP: '$price.price',
                                },
                              },
                            },
                            price.max.length,
                          ],
                        },
                        -1,
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: [
                            {
                              $cmp: [
                                {
                                  $cond: {
                                    if: {
                                      $or: [
                                        {
                                          $eq: ['$price', null],
                                        },
                                        {
                                          $eq: ['$price.price', null],
                                        },
                                      ],
                                    },
                                    then: 0,
                                    else: {
                                      $strLenCP: '$price.price',
                                    },
                                  },
                                },
                                price.max.length,
                              ],
                            },
                            0,
                          ],
                        },
                        {
                          $ne: [
                            {
                              $cmp: ['$price.price', price.max],
                            },
                            1,
                          ],
                        },
                      ],
                    },
                  ],
                },
                then: true,
                else: false,
              },
            },
          ],
        },
      },
    }
    pipeline.push(query)
    // console.dir(query, { depth: null })
  }

  const aggregate = Token.aggregate(pipeline)

  const customLabels = {
    totalDocs: 'total',
    docs: 'tokens',
    limit: 'limit',
    page: 'currentPage',
    nextPage: 'nextPage',
    prevPage: 'prevPage',
    totalPages: 'totalPages',
    hasPrevPage: 'hasPrev',
    hasNextPage: 'hasNext',
    pagingCounter: 'pageCounter',
    meta: 'paginationInfo',
  }
  const options = {
    page,
    limit,
    customLabels,
  }

  const result = (await Token.aggregatePaginate(aggregate, options)) as any

  return result
}

/**
 * Favorite given token and returns updated token
 * @param slug Identifier of collection
 * @param tokenId token id
 * @param publicKey favorited user public key
 * @returns Token
 */
export const favoriteToken = async (
  slug: string,
  tokenId: string,
  publicKey: string,
) => {
  const collectionNFT = await Collection.findOne({ slug })

  if (collectionNFT === null) throw Error(`Not exist ${slug}`)

  let token = await Token.findOne({ collectionNFT, tokenId })
  if (token === null) throw new ApiError(404, `Not exist ${slug}-${tokenId}`)
  const user = await User.findOne({ publicKey })
  if (user === null) throw new ApiError(404, `Not exist user ${publicKey}`)

  if (
    token.favoritedUsers.find((u: any) => u.toString() === user._id.toString())
  )
    // @ts-ignore
    token.favoritedUsers = token.favoritedUsers.filter(
      (u: any) => u.toString() !== user._id.toString(),
    )
  else token.favoritedUsers.push(user._id)

  await token.save()

  token = ((await getTokens({ where: { slug, tokenId } })) as any).tokens[0]
  return token
}

export const addUserToken = async (accountHash: string) => {
  console.log(`adding token ${accountHash}`)
  let page = 1
  const limit = 10
  let added = 0
  do {
    const { data } = await axios.get<MakeServices.TokensByOwnerResponse>(
      `https://event-store-api-clarity-mainnet.make.services/accounts/${accountHash}/nft-tokens?fields=contract_package&page=${page}&limit=${limit}`,
    )

    const promises = data.data.map(async (token) => {
      const metadata = {} as any
      token.metadata.forEach((meta) => {
        metadata[meta.key] = meta.value
      })

      const result = await addTokenByContractPackageHash(
        token.contract_package_hash,
        token.token_id,
        metadata,
        token.owner_account_hash,
      )
      return result
    })
    const result = await Promise.all(promises)
    added += result.filter((r) => r).length
    if (data.pageCount === page) break
    page += 1
    // eslint-disable-next-line no-constant-condition
  } while (true)
  return added
}

export const addTokensByContractPackageHash = async (
  contractPackageHash: string,
) => {
  let page = 1
  const limit = 10
  let added = 0
  do {
    const { data } = await axios.get<TokensByContractPackageHashResponse>(
      `https://event-store-api-clarity-mainnet.make.services/contract-packages/${contractPackageHash}/nft-tokens?page=${page}&limit=${limit}`,
    )

    const promises = data.data.map(async (token) => {
      const metadata = {} as any
      token.metadata.forEach((meta) => {
        metadata[meta.key] = meta.value
      })

      const result = await addTokenByContractPackageHash(
        token.contract_package_hash,
        token.token_id,
        metadata,
        token.owner_account_hash,
      )
      return result
    })

    const result = await Promise.all(promises)
    added += result.filter((r) => r).length
    if (data.pageCount === page) break
    page += 1

    // eslint-disable-next-line no-constant-condition
  } while (true)
  return added
}

export const addTokenByContractPackageHash = async (
  contractPackageHash: string,
  tokenId: string,
  metadata: Metadata,
  owner: string,
): Promise<boolean> => {
  const collectionNFT = await getCollectionOrCreate(contractPackageHash)

  await Token.findOneAndUpdate(
    { collectionNFT, tokenId },
    {
      collectionNFT,
      tokenId,
      metadata,
      owner,
    },
    {
      upsert: true,
      new: true,
    },
  )

  return true
}

export const addTokenByCollectionDocument = async (
  collectionNFT: CollectionDocument,
  tokenId: string,
  metadata: Metadata,
  owner: string,
): Promise<TokenDocument> => {
  return await Token.findOneAndUpdate(
    { collectionNFT, tokenId },
    {
      collectionNFT,
      tokenId,
      metadata,
      owner,
    },
    {
      upsert: true,
      new: true,
    },
  )
}

export const getTokenOrCreate = async (
  collectionNFT: CollectionDocument,
  tokenId: string,
): Promise<TokenDocument> => {
  const cep47Client = new CEP47Client(
    NEXT_PUBLIC_CASPER_NODE_ADDRESS,
    NEXT_PUBLIC_CASPER_CHAIN_NAME,
  )
  const casperClient = new CasperClient(NEXT_PUBLIC_CASPER_NODE_ADDRESS)
  const contractHash = await getContractHashFromContractPackageHash(
    casperClient,
    collectionNFT.contractPackageHash,
  )
  cep47Client.setContractHash(`hash-${contractHash}`)

  const token_owner = await cep47Client.getOwnerOf(tokenId)
  let token = await Token.findOneAndUpdate(
    {
      collectionNFT,
      tokenId,
    },
    { owner: token_owner.slice(13) },
    { new: true },
  )
  if (token === null) {
    const tokenMeta: Map<string, string> = await cep47Client.getTokenMeta(
      tokenId,
    )
    const metadataArray = Array.from(tokenMeta.entries()).map((t) => {
      return {
        key: t[0],
        value: t[1],
      }
    })
    const metadata = {} as any
    metadataArray.forEach((meta) => {
      metadata[meta.key] = meta.value
    })
    token = new Token({
      collectionNFT,
      tokenId,
      owner: token_owner.slice(13),
      metadata,
    })
    await token.save()
  }
  return token
}

export const getHighestSalesInfo = async (slug: string, tokenId: string) => {
  const collectionNFT = await Collection.findOne({ slug })
  if (collectionNFT === null)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found collection')
  const token = await Token.findOne({ collectionNFT, tokenId })
  if (token === null)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found token')

  const pipeline: PipelineStage[] = []

  pipeline.push({
    $match: {
      token: token._id,
    },
  })

  pipeline.push({
    $lookup: {
      from: 'sales',
      localField: '_id',
      foreignField: 'token',
      as: 'highestSale',
      pipeline: [
        {
          $set: {
            priceLen: {
              $strLenCP: '$price',
            },
          },
        },
        {
          $sort: {
            priceLen: -1,
            price: -1,
          },
        },
        {
          $group: {
            _id: '$payToken',
            price: {
              $first: '$price',
            },
          },
        },
        {
          $set: {
            payToken: '$_id',
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ],
    },
  })

  pipeline.push({
    $unset: [
      '_id',
      'creator',
      'startTime',
      'token',
      '__v',
      'createdAt',
      'updatedAt',
    ],
  })

  const highestSale = await Sale.aggregate(pipeline)
  if (highestSale.length !== 1) return null
  return highestSale[0].highestSale
}

export const getSalesInfo = async (
  slug: string,
  tokenId: string,
  page = 1,
  limit = 20,
) => {
  const collectionNFT = await Collection.findOne({ slug })
  if (collectionNFT === null)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found collection')
  const token = await Token.findOne({ collectionNFT, tokenId })
  if (token === null)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found token')

  const pipeline: PipelineStage[] = []

  pipeline.push({
    $match: {
      token: token._id,
    },
  })
  pipeline.push({
    $project: {
      _id: 0,
      __v: 0,
    },
  })
  pipeline.push({
    $sort: {
      createdAt: -1,
    },
  })

  const customLabels = {
    totalDocs: 'total',
    docs: 'sales',
    limit: 'limit',
    page: 'currentPage',
    nextPage: 'nextPage',
    prevPage: 'prevPage',
    totalPages: 'totalPages',
    hasPrevPage: 'hasPrev',
    hasNextPage: 'hasNext',
    pagingCounter: 'pageCounter',
    meta: 'paginationInfo',
  }
  const options = {
    page,
    limit,
    customLabels,
  }

  const aggregate = Sale.aggregate(pipeline)
  const sales = await Sale.aggregatePaginate(aggregate, options)

  return sales
}

export const getOffersInfo = async (
  slug: string,
  tokenId: string,
  page = 1,
  limit = 20,
) => {
  const collectionNFT = await Collection.findOne({ slug })
  if (collectionNFT === null)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found collection')
  const token = await Token.findOne({ collectionNFT, tokenId })
  if (token === null)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found token')

  const pipeline: PipelineStage[] = []

  pipeline.push({
    $match: {
      token: token._id,
    },
  })
  pipeline.push({
    $project: {
      _id: 0,
      __v: 0,
    },
  })
  pipeline.push({
    $sort: {
      createdAt: -1,
    },
  })

  const customLabels = {
    totalDocs: 'total',
    docs: 'sales',
    limit: 'limit',
    page: 'currentPage',
    nextPage: 'nextPage',
    prevPage: 'prevPage',
    totalPages: 'totalPages',
    hasPrevPage: 'hasPrev',
    hasNextPage: 'hasNext',
    pagingCounter: 'pageCounter',
    meta: 'paginationInfo',
  }
  const options = {
    page,
    limit,
    customLabels,
  }

  const aggregate = Offer.aggregate(pipeline)
  const sales = await Offer.aggregatePaginate(aggregate, options)

  return sales
}
