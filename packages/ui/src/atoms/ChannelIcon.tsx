import { MessageCircle, Send as TelegramIcon, Mail } from 'lucide-react'
import { cn } from '../utils'
import { CHANNELS } from '../constants'
import type { Channel } from '../types'

export function ChannelIcon({
  channel,
  className,
}: {
  channel: Channel
  className?: string
}) {
  const Icon =
    channel === 'whatsapp'
      ? MessageCircle
      : channel === 'telegram'
        ? TelegramIcon
        : Mail
  return <Icon className={cn(CHANNELS[channel].color, className)} />
}
