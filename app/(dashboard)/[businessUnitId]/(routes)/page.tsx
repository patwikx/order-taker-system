import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function BusinessUnitPage({ params }: Props) {
  const { businessUnitId } = await params
  
  // Redirect to the POS system
  redirect(`/${businessUnitId}/pos`)
}