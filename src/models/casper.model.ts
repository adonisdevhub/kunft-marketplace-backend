import mongoose, { Schema } from 'mongoose'

const CasperSchema = new Schema(
  {
    lasteEventId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true, capped: { size: 1024, max: 1000, autoIndexId: true } },
)

export const Casper = mongoose.model('Casper', CasperSchema)
