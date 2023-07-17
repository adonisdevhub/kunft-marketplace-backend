import { Offer } from '@/models'

import { TokenDocument } from '@/interfaces/mongoose.gen'

export async function onOfferCreated(
  creator: string,
  token: TokenDocument,
  owner: string,
  price: string,
  startTime: string,
  deployHash: string,
  payToken?: string,
  additionalRecipient?: string,
) {
  const buyOrder = new Offer({
    creator,
    token,
    owner,
    payToken,
    price,
    startTime,
    additionalRecipient,
    pendingDeployHash: deployHash,
    status: 'pending',
  })
  await buyOrder.save()
}

export async function onOfferCanceled(
  creator: string,
  token: TokenDocument,
  startTime: string,
  deployHash: string,
) {
  await Offer.findOneAndUpdate(
    {
      creator,
      token,
      startTime,
    },
    {
      status: 'canceled',
      canceledDeployHash: deployHash,
    },
  )
}

export async function onOfferAccepted(
  creator: string,
  token: TokenDocument,
  startTime: string,
  owner: string,
  deployHash: string,
) {
  await Offer.findOneAndUpdate(
    {
      creator,
      token,
      startTime,
    },
    {
      owner,
      status: 'succeed',
      succeedDeployHash: deployHash,
    },
  )
  token.owner = creator
  await token.save()
}
