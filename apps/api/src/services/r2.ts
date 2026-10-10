import { AwsClient } from 'aws4fetch'
import { TRPCError } from '@trpc/server'
import { env } from '../env'

const getClient = () => {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'R2 is not configured on the server',
    })
  }
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })
}

/** Returns a URL the client can PUT the file to directly, without going through our server. */
export const presignUpload = async (key: string, contentType: string, expiresInSeconds = 600) => {
  const client = getClient()
  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`,
  )
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds))
  const signed = await client.sign(
    new Request(url, { method: 'PUT', headers: { 'content-type': contentType } }),
    {
      aws: { signQuery: true },
    },
  )
  const publicBase = env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '')
  return {
    uploadUrl: signed.url,
    method: 'PUT' as const,
    headers: { 'content-type': contentType },
    key,
    publicUrl: publicBase ? `${publicBase}/${key}` : null,
    expiresInSeconds,
  }
}
