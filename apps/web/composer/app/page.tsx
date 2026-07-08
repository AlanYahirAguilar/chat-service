import { Compose } from '@/Compose'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string }>
}) {
  const { contact } = await searchParams
  return <Compose initialContactId={contact} />
}
