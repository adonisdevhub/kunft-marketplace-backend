import mongoose, { AggregatePaginateModel, Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

import { casperValidation } from '@/validations'

import { OfferDocument } from '../interfaces/mongoose.gen'

const OfferSchema = new Schema(
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
    owner: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
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

OfferSchema.plugin(mongooseAggregatePaginate)

export const Offer: AggregatePaginateModel<OfferDocument> = mongoose.model(
  'Offer',
  OfferSchema,
)
