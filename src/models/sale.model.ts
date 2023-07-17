import mongoose, { AggregatePaginateModel, Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

import { casperValidation } from '@/validations'

import { SaleDocument } from '@/interfaces/mongoose.gen'

const SaleSchema = new Schema(
  {
    creator: {
      type: String,
      required: true,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    token: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Token',
    },
    buyer: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    payToken: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    price: {
      type: String,
      required: true,
    },
    startTime: {
      type: Number,
      required: true,
    },
    additionalRecipient: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    status: {
      type: String,
      enum: ['pending', 'succeed', 'canceled'],
      default: 'pending',
      required: true,
    },
    pendingDeployHash: {
      type: String,
      required: true,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    succeedDeployHash: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    canceledDeployHash: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
  },
  { timestamps: true },
)

SaleSchema.plugin(mongooseAggregatePaginate)

export const Sale: AggregatePaginateModel<SaleDocument> = mongoose.model(
  'Sale',
  SaleSchema,
)
