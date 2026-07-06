import 'server-only'

import { createTaleAppClient, getAppToken } from '@turinhub/tale-js-sdk'

const getTaleAppToken = () =>
  getAppToken({
    baseUrl: process.env.TALE_BASE_URL,
    appKey: process.env.TALE_APP_KEY,
    appSecret: process.env.TALE_APP_SECRET,
  })

export const createTaleServerAppClient = () =>
  createTaleAppClient({
    baseUrl: process.env.TALE_BASE_URL,
    appTokenProvider: getTaleAppToken,
  })

export type TaleServerAppClient = ReturnType<typeof createTaleServerAppClient>
