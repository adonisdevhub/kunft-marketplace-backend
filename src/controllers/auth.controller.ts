import {
  CLPublicKey,
  decodeBase16,
  verifyMessageSignature,
} from 'casper-js-sdk'
import Chance from 'chance'
import express from 'express'
import { StatusCodes } from 'http-status-codes'

import { JWT_EXPIRE, JWT_NAME } from '@/config'

import { User } from '@/models/user.model'

import { generateJwtToken } from '@/services/auth'

import { ApiError } from '@/utils'
import catchAsync from '@/utils/catchAsync'

export const generateNonce = () => {
  const chance = new Chance()
  const nonce = chance.string({ length: 20 })

  return nonce
}

export const checkAuth = catchAsync(
  async (req: express.Request, res: express.Response) => {
    try {
      const { publicKey } = req.params
      const nonce = await User.getNonce(publicKey)
      if (nonce === undefined) throw Error(`Not exist user ${publicKey}`)

      res.json({ nonce })
    } catch (error: any) {
      if (error instanceof Error) {
        console.error(error)
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: error.message })
      }
    }
  },
)

export const getNonce = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { publicKey } = req.params
    // @ts-ignore
    const nonce = await User.getNonce(publicKey)
    if (nonce === undefined) throw Error(`Not exist user ${publicKey}`)
    res.json({ nonce })
  },
)

export const signUp = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { publicKey: publicKeyString, signature: signatureString } = req.body
    const publicKey = CLPublicKey.fromHex(publicKeyString)

    let user = await User.findByPublicKey(publicKey.toHex())

    if (user) {
      throw Error(`${publicKey.toHex()} alreaday exist`)
    }

    const signature = decodeBase16(signatureString)
    const message = `Signup with KUNFT with ${publicKeyString}`

    const result = verifyMessageSignature(publicKey, message, signature)
    if (result === false) {
      throw Error(`Invalid Signature`)
    }

    const accountHash = publicKey
      .toAccountHashStr()
      .slice('account-hash-'.length)
    user = new User({
      name: publicKeyString,
      publicKey: publicKeyString,
      accountHash,
      slug: accountHash,
      nonce: generateNonce(),
    })
    await user.save()

    const signObject = user.toJSON()

    const token = generateJwtToken(signObject)

    res.cookie(JWT_NAME, token, {
      maxAge: JWT_EXPIRE * 1000,
      httpOnly: process.env.NODE_ENV !== 'development',
      secure: process.env.NODE_ENV !== 'development',
    })

    res.json(user)
  },
)

export const signIn = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { publicKey: publicKeyString, signature: signatureString } = req.body
    const publicKey = CLPublicKey.fromHex(publicKeyString)

    const signature = decodeBase16(signatureString)

    const user = await User.findOne({ publicKey: publicKeyString })

    if (user === null)
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Not exist user ${publicKeyString}`,
      )

    const message = `Signin KUNFT with\n public key: ${publicKeyString}\nnonce: ${user.nonce}`

    const verified = verifyMessageSignature(publicKey, message, signature)

    if (!verified)
      throw new ApiError(StatusCodes.UNAUTHORIZED, `Invalid signature`)

    user.nonce = generateNonce()

    await user.save()

    const signObject = user.toJSON()

    const token = generateJwtToken(signObject)

    res.cookie(JWT_NAME, token, {
      maxAge: JWT_EXPIRE * 1000,
      httpOnly: process.env.NODE_ENV !== 'development',
      secure: process.env.NODE_ENV !== 'development',
    })

    res.json({ ...signObject, expire: JWT_EXPIRE * 1000 })
  },
)

export const signOut = catchAsync(
  async (req: express.Request, res: express.Response) => {
    res.clearCookie(JWT_NAME)
    res.json({ ok: true })
  },
)

export const updateInfo = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const info = req.body
    info.firstName = info.name
    delete info.name
    const oldUser = req.headers.user! as any
    console.log(info, req.headers)
    const user = await User.findOneAndUpdate(
      { publicKey: oldUser.publicKey },
      { ...info },
      { new: true },
    )

    res.json(user)
  },
)
