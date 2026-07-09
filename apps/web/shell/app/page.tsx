import { redirect } from 'next/navigation'

// El host redirige a la zona por defecto (dashboard).
export default function Page() {
  redirect('/dashboard')
}
