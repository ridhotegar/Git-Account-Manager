import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

function Avatar({
  className,
  src,
  alt = "",
  fallback,
  ...props
}: AvatarProps) {
  const [error, setError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {fallback || alt?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}
Avatar.displayName = "Avatar";

export { Avatar };
