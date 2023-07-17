/* eslint-disable @typescript-eslint/no-non-null-assertion */
import retry from 'async-retry'
import {
  CasperClient,
  CLMap,
  CLString,
  CLValueBuilder,
  EventName,
  EventStream,
} from 'casper-js-sdk'

import {
  NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH,
} from '@/config'

import { Casper } from '@/models'

import {
  collectionServices,
  offerServices,
  saleServices,
  tokenServices,
} from '@/services'

import { MarketplaceEventParser, MarketplaceEvents } from '../marketplace'
import { getContractPackageHashFromContractHash } from '../utils'

export const _startMarketplaceEventStream = async () => {
  try {
    console.info(`Starting Marketplace event listener`)
    const es = new EventStream(NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS!)
    const contractPackageHash = NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH!

    es.subscribe(EventName.DeployProcessed, async (events) => {
      const parsedEvents = MarketplaceEventParser(
        {
          contractPackageHash: contractPackageHash.slice(5),
          eventNames: [
            MarketplaceEvents.SellOrderCreated,
            MarketplaceEvents.SellOrderCanceled,
            MarketplaceEvents.SellOrderBought,
            MarketplaceEvents.BuyOrderCreated,
            MarketplaceEvents.BuyOrderCanceled,
            MarketplaceEvents.BuyOrderAccepted,
          ],
        },
        events,
      )
      try {
        if (parsedEvents && parsedEvents.success) {
          console.info('***  MARKETPLACE EVENT  ***')

          const promises = parsedEvents.data.map(async (event: any) => {
            const eventName = event.name as MarketplaceEvents
            const deployHash = event.deployHash as string
            const eventParams: CLMap<CLString, CLString> = event.clValue
            console.info(`Handling ${eventName} event`)

            // Event params
            const creator = eventParams.get(CLValueBuilder.string('creator'))
            const collection = eventParams.get(
              CLValueBuilder.string('collection'),
            )
            const tokenId = eventParams.get(CLValueBuilder.string('token_id'))
            const payToken = eventParams.get(CLValueBuilder.string('pay_token'))
            const price = eventParams.get(CLValueBuilder.string('price'))
            const startTime = eventParams.get(
              CLValueBuilder.string('start_time'),
            )
            const buyer = eventParams.get(CLValueBuilder.string('buyer'))
            const owner = eventParams.get(CLValueBuilder.string('owner'))
            const additionalRecipient = eventParams.get(
              CLValueBuilder.string('additional_recipient'),
            )

            const casperClient = new CasperClient(
              NEXT_PUBLIC_CASPER_NODE_ADDRESS,
            )
            const contractPackageHash =
              await getContractPackageHashFromContractHash(
                casperClient,
                collection!.value(),
              )
            const collectionDB = await collectionServices.getCollectionOrCreate(
              contractPackageHash,
            )

            const token = await tokenServices.getTokenOrCreate(
              collectionDB,
              tokenId!.value(),
            )
            let formatedCreatorHash = creator!.value()
            formatedCreatorHash = formatedCreatorHash.slice(20).slice(0, -2)

            switch (eventName) {
              case MarketplaceEvents.SellOrderCreated: {
                const preferPayToken =
                  payToken!.value() === 'None'
                    ? undefined
                    : payToken!.value().slice(18).slice(0, -2)
                await saleServices.onTokenListed(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  price!.value(),
                  deployHash,
                  preferPayToken,
                )

                break
              }
              case MarketplaceEvents.SellOrderCanceled:
                await saleServices.onCancelListing(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  deployHash,
                )
                break
              case MarketplaceEvents.SellOrderBought: {
                const formattedbuyer = buyer!.value().slice(20).slice(0, -2)
                const preferAdditionalRecipient =
                  additionalRecipient && additionalRecipient.value() !== 'None'
                    ? additionalRecipient.value()
                    : undefined
                await saleServices.onBuyListedToken(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  formattedbuyer,
                  deployHash,
                  preferAdditionalRecipient,
                )
                break
              }

              case MarketplaceEvents.BuyOrderCreated: {
                const preferPayToken =
                  payToken!.value() === 'None' ? undefined : payToken!.value()
                const preferAdditionalRecipient =
                  additionalRecipient!.value() === 'None'
                    ? undefined
                    : additionalRecipient!.value()
                await offerServices.onOfferCreated(
                  formatedCreatorHash,
                  token,
                  token.owner,
                  price!.value(),
                  startTime!.value(),
                  deployHash,
                  preferPayToken,
                  preferAdditionalRecipient,
                )

                break
              }
              case MarketplaceEvents.BuyOrderCanceled: {
                await offerServices.onOfferCanceled(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  deployHash,
                )
                break
              }
              case MarketplaceEvents.BuyOrderAccepted: {
                await offerServices.onOfferAccepted(
                  formatedCreatorHash,
                  token,
                  startTime!.value(),
                  owner!.value(),
                  deployHash,
                )

                break
              }
              default:
                console.error(`Unhandled event: ${eventName}`)
            }
          })
          await Promise.all(promises)
          console.info('***     ***')
        }
        const consumed_event = new Casper({ lasteEventId: events.id })
        await consumed_event.save()
      } catch (err: any) {
        console.error(`***Marketplace EventStream Error***`)
        console.error(err)
        console.error(`*** ***`)
      }
    })
    const consumedEvent = await Casper.find()
      .sort({ createdAt: 'desc' })
      .limit(1)
    if (consumedEvent.length === 1) {
      console.info(`Start Event listener from ${consumedEvent[0].lasteEventId}`)
      es.start(consumedEvent[0].lasteEventId)
    } else es.start()
  } catch (error: any) {
    console.error(error)
  }
}

export const startMarketplaceEventStream = async () => {
  //
  await retry(_startMarketplaceEventStream, {
    retries: 10,
    minTimeout: 200000,
    onRetry(e, attempt) {
      console.log(e, attempt)
    },
  })
}
