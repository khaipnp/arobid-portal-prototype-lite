import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
  fallbackClassName?: string;
}

export function getUserInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "?";
}

export function UserAvatar({
  name,
  imageUrl,
  size = "default",
  className,
}: UserAvatarProps) {
  return (
    <Avatar className={className} size={size}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
      <AvatarFallback className="bg-white text-legend border border-legend text-[10px] font-semibold">
        Logo
      </AvatarFallback>
    </Avatar>
  );
}
