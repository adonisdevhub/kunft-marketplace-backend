import { CLPublicKey } from 'casper-js-sdk'
import { StatusCodes } from 'http-status-codes'
import { PipelineStage } from 'mongoose'

import { User } from '@/models'

import { ApiError } from '@/utils'

export interface GetUserInfoInput {
  slug?: string
  publicKey?: string
  accountHash?: string
}

export const getUserInfo = async (input: GetUserInfoInput) => {
  const basePipeline = [
    {
      $lookup: {
        from: 'tokens',
        localField: 'accountHash',
        foreignField: 'owner',
        as: 'tokens',
      },
    },
    {
      $addFields: {
        ownedTokens: {
          $cond: {
            if: {
              $isArray: '$tokens',
            },
            then: {
              $size: '$tokens',
            },
            else: 'NA',
          },
        },
        name: {
          $concat: [
            {
              $cond: [
                {
                  $ifNull: ['$firstName', false],
                },
                '$firstName',
                null,
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        tokens: 0,
        _id: 0,
        __v: 0,
        nonce: 0,
      },
    },
    {
      $project: {
        publicKey: 1,
        verified: 1,
        accountHash: 1,
        slug: 1,
        ownedTokens: 1,
        name: 1,
        email: 1,
        avatar: 1,
        emailVerified: {
          $cond: {
            if: {
              $ifNull: ['$email', false],
            },
            then: '$emailVerified',
            else: '$$REMOVE',
          },
        },
      },
    },
  ]
  let pipeline: PipelineStage[] = []

  pipeline.push({
    $match: {
      ...input,
    },
  })

  pipeline = pipeline.concat(basePipeline)

  const users = await User.aggregate(pipeline)

  if (users.length !== 1)
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not exist.')

  console.log(users[0])

  return users[0]
}

export const addUserFields = async () => {
  const users = await User.find()
  users.forEach(async (user) => {
    if (!user.slug || !user.accountHash) {
      const accountHash = CLPublicKey.fromHex(user.publicKey)
        .toAccountHashStr()
        .slice('account-hash-'.length)
      user = await user.updateOne({ slug: user.publicKey, accountHash })
    }
  })
}
