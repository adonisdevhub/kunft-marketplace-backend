import express from 'express'

import { userValidation } from '@/validations'

import { addToken } from '@/controllers/user.controller'
import { auth, validate } from '@/middlewares'

const router = express.Router()

router.post('/add-token', auth, validate(userValidation.addToken), addToken)

export default router
