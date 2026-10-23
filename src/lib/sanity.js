import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || '94wv2qdl',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
})

// Setup image builder for portable text images
const builder = imageUrlBuilder(client)
export function urlFor(source) {
  return builder.image(source)
}
