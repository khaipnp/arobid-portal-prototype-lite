<script lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar"

interface Props {
  name: string
  imageUrl?: string | null
  size?: "default" | "sm" | "lg"
  class?: string
  fallbackClassName?: string
}

let {
  name,
  imageUrl = null,
  size = "default",
  class: className = "",
  fallbackClassName = ""
}: Props = $props()

function getUserInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "?"
}
</script>

<Avatar class={className}>
  {#if imageUrl}
    <AvatarImage src={imageUrl} alt={name} />
  {/if}
  <AvatarFallback class={fallbackClassName}>
    {getUserInitials(name)}
  </AvatarFallback>
</Avatar>
