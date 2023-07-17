import mongoose, { Schema } from 'mongoose'
import validator from 'validator'

import { UserDocument, UserModel } from '@/interfaces/mongoose.gen'

const UserSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    lowercase: true,
    index: true,
  },
  publicKey: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    lowercase: true,
    index: true,
  },
  accountHash: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    lowercase: true,
    index: true,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  avatar: {
    type: String,
  },
  description: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please fill a valid email address'],
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  nonce: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
})

UserSchema.statics = {
  async getNonce(publicKey: string): Promise<string | undefined> {
    const user = await this.findOne({ publicKey }).select('nonce')
    return user?.nonce
  },
  async findByPublicKey(publicKey: string): Promise<UserDocument | null> {
    return await this.findOne({ publicKey })
  },
}

// NOTE: `this: UserDocument` is required for virtual properties to tell TS the type of `this` value using the "fake this" feature
// you will need to add these in after your first ever run of the CLI
UserSchema.virtual('name').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`
})

UserSchema.method('toJSON', function (this: UserDocument) {
  const {
    // @ts-ignore
    __v,
    _id,
    nonce: _,
    firstName,
    lastName: __,
    ...object
  } = this.toObject()
  // @ts-ignore
  object.id = _id
  // @ts-ignore
  object.name = firstName
  return object
})

export const User = mongoose.model<UserDocument, UserModel>('User', UserSchema)
