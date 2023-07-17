/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CEP47Client,
  CEP47EventParser,
  CEP47Events,
} from 'casper-cep47-js-client'
import {
  CLMap,
  CLString,
  CLValueBuilder,
  EventName,
  EventStream,
} from 'casper-js-sdk'

import { Collection } from '@/models/collection.model'
import { Token } from '@/models/token.model'

import {
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
} from '../../config'

export const startCEP47EventStream = async (
  contractHash: string,
  contractPackageHash: string,
) => {
  const cep47 = new CEP47Client(
    NEXT_PUBLIC_CASPER_NODE_ADDRESS!,
    NEXT_PUBLIC_CASPER_CHAIN_NAME!,
  )

  let collection = await Collection.findOne({
    contractPackageHash: contractPackageHash.slice(5),
  })

  cep47.setContractHash(contractHash, contractPackageHash)

  if (collection === null) {
    collection = new Collection({
      contractPackageHash: contractPackageHash.slice(5),
      contractHash: contractHash.slice(5),
      verified: true,
      slug: contractHash,
      name: await cep47.name(),
      symbol: await cep47.symbol(),
      description: 'Casper NFT',
      image:
        'https://gateway.pinata.cloud/ipfs/QmahHrFUGaTRS53Dag6BQ68WRxnGVM7joCK8fDtsRB5QFB',
    })
    await collection.save()
  }

  const es = new EventStream(NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS!)

  es.subscribe(EventName.DeployProcessed, (events) => {
    const parsedEvents = CEP47EventParser(
      {
        contractPackageHash,
        eventNames: [CEP47Events.MintOne, CEP47Events.BurnOne],
      },
      events,
    )

    if (parsedEvents && parsedEvents.success) {
      console.info('*** CEP47 EVENT ***')
      parsedEvents.data.map(async (event: any) => {
        const eventName = event.name as CEP47Events
        const eventParams: CLMap<CLString, CLString> = event.clValue
        // const recipient = eventParams.get(CLValueBuilder.string('recipient'))
        // const owner = eventParams.get(CLValueBuilder.string('owner'))
        const tokenId = eventParams.get(CLValueBuilder.string('token_id'))
        console.info(`Handling ${eventName} event`)

        switch (eventName) {
          case CEP47Events.MintOne: {
            const asset = new Token({
              collectionNFT: collection,
              tokenId: tokenId!.value(),
              name: `${collection!.name} #${tokenId!.value()}`,
              mintDate: Date.now(),
              metadata: await cep47.getTokenMeta(tokenId!.value()),
            })
            await asset.save()
            break
          }
          default:
            console.error(`Unhandled ${eventName}`)
        }
      })
      console.info('*** ***')
    }
  })

  es.start()
}
