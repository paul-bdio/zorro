import {db} from 'src/lib/db'
import {isVerified} from 'src/services/cachedProfiles/cachedProfiles'
import {Handler} from 'aws-lambda'

type Params = {
  purposeIdentifier: string
  externalAddresses: string[]
}

// This endpoint is used by the Snapshot strategy named `zorro`
export const handler: Handler = async (event) => {
  const params: Params = JSON.parse(event.body)
  const {purposeIdentifier, externalAddresses} = params

  const connections = await db.connection.findMany({
    where: {
      purposeIdentifier,
      externalAddress: {in: externalAddresses.map((str) => str.toLowerCase())},
    },
    include: {
      cachedProfile: true,
    },
  })

  const verifiedExternalAddresses = connections
    .filter((connection) => isVerified(connection.cachedProfile))
    .map((connection) => connection.externalAddress)

  return {
    statusCode: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({verifiedExternalAddresses}),
  }
}
