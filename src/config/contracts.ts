import { Chain } from './chain'

export default {
  marketplace: {
    [Chain.MAINNET]: {
      contractPackageHash:
        'hash-cc1b8171004b052ccc998db20f82a1ccca5b16b4c9b64b4b8968e12cbe8f40b0',
      versions: [
        'hash-f4adb2ec4d8a51011b98fd3b5564458d1a02060c690faf1995b9459432948738',
      ],
    },
    [Chain.TESTNET]: {
      contractPackageHash:
        'hash-7d7896b8e0f04f6c54904f834427be1fe8b0f5acdadb27e32c44051e35cb193c',
      versions: [
        'hash-be553ebfaa152c3dc1185c2265b440bea33d5aee3160f0d30524d1034a196dd2',
        'hash-4b0ae77a1bcb114293580dc0996d7ea35fd121e9086f93ea0a71e2f75ab5e0b3',
        'hash-11e2aa302b64ef51057e1507fc7f496f9472443a404d2aa8293b8e997d8cf125',
        'hash-d0546132ab1e8524bd920dc22a37e83defc3b388cb910f03958f40bad13ddcb1',
        'hash-447714147d97a4fe469326bf7b80a34bc693c7593850e5c6350dd2536b5a5f1d',
      ],
    },
  },
}
