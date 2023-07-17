import mongoose, { AggregatePaginateModel, Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

import { TokenDocument } from '@/interfaces/mongoose.gen'

const TokenSchema = new Schema({
  collectionNFT: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Collection',
  },
  tokenId: {
    type: String,
    required: true,
  },
  metadata: {
    type: Map,
    required: true,
  },
  favoritedUsers: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
  viewed: {
    type: Number,
    default: 0,
  },
  // account hash hex string (not formatted)
  owner: {
    type: String,
    required: true,
  },
})

TokenSchema.plugin(mongooseAggregatePaginate)

export const Token: AggregatePaginateModel<TokenDocument> = mongoose.model(
  'Token',
  TokenSchema,
)
