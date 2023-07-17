import mongoose, { AggregatePaginateModel, Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

import { CollectionDocument, CollectionModel } from '@/interfaces/mongoose.gen'

const CollectionSchema = new Schema({
  contractPackageHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  contractHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    uppercase: false,
    index: true,
  },
  deployer: String,
  symbol: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  description: { type: String },
  verified: { type: Boolean, required: true, default: false },
  promoted: { type: Boolean, required: true, default: false },
  background: { type: String },
  logo: { type: String },
  twitter: { type: String },
  discord: { type: String },
  website: { type: String },
})

CollectionSchema.plugin(mongooseAggregatePaginate)

export const Collection: AggregatePaginateModel<CollectionDocument> =
  mongoose.model<CollectionDocument, CollectionModel>(
    'Collection',
    CollectionSchema,
  )
