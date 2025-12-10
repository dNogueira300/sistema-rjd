import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  variant?: "default" | "circle" | "circle-glow";
  className?: string;
  showText?: boolean;
  format?: "svg" | "png" | "auto";
  theme?: "light" | "dark";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
  xxl: "w-32 h-32",
};

const imageSizeNumbers = {
  sm: 32, // Aumentado de 24 a 32
  md: 48, // Aumentado de 36 a 48
  lg: 64, // Aumentado de 48 a 64
  xl: 96, // Aumentado de 72 a 96
  xxl: 128, // Aumentado de 96 a 128
};

export default function Logo({
  size = "md",
  variant = "default",
  className,
  showText = false,
  format = "auto",
  theme = "dark",
}: LogoProps) {
  const logoSize = sizeClasses[size];
  const imageSizeNumber = imageSizeNumbers[size];

  // Determinar qué formato usar
  const logoSrc =
    format === "svg"
      ? "/logo.svg"
      : format === "png"
      ? "/logo.png"
      : "/logo.svg"; // Default a SVG

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Fallback a PNG si SVG falla
    const target = e.target as HTMLImageElement;
    if (target.src.includes(".svg")) {
      target.src = "/logo.png";
    }
  };

  // Determinar clases según variante
  let containerClasses = "";

  switch (variant) {
    case "circle":
      containerClasses = "logo-circle-white"; // Cambiado a fondo blanco
      break;
    case "circle-glow":
      containerClasses = "logo-circle-white-glow"; // Cambiado a fondo blanco con glow
      break;
    default:
      containerClasses =
        "transform hover:scale-105 transition-transform duration-300 drop-shadow-lg";
      break;
  }

  const logoContent = (
    <div
      className={cn(
        logoSize,
        containerClasses,
        variant !== "default" ? "flex items-center justify-center" : "",
        className
      )}
    >
      <Image
        src={logoSrc}
        alt="Suministro y Servicios RJD"
        width={imageSizeNumber}
        height={imageSizeNumber}
        className="object-contain"
        onError={handleImageError}
        priority
      />
    </div>
  );

  if (!showText) {
    return logoContent;
  }

  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {logoContent}

      <div className="flex flex-col">
        <span
          className={cn(
            "font-bold leading-tight",
            size === "sm"
              ? "text-sm"
              : size === "md"
              ? "text-lg"
              : size === "lg"
              ? "text-xl"
              : size === "xl"
              ? "text-2xl"
              : "text-3xl",
            theme === "dark" ? "text-slate-100" : "text-gray-900"
          )}
        >
          Suministro y Servicios
        </span>
        <span
          className={cn(
            "font-bold text-gradient-blue-green",
            size === "sm"
              ? "text-xs"
              : size === "md"
              ? "text-base"
              : size === "lg"
              ? "text-lg"
              : size === "xl"
              ? "text-xl"
              : "text-2xl"
          )}
        >
          RJD
        </span>
      </div>
    </div>
  );
}

// Componente fallback mejorado para tema oscuro
export function LogoFallback({
  size = "md",
  variant = "default",
  className,
  theme = "dark",
}: {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  variant?: "default" | "circle" | "circle-glow";
  className?: string;
  theme?: "light" | "dark";
}) {
  const sizeClass = sizeClasses[size];
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-2xl",
    xxl: "text-4xl",
  };

  let containerClasses = "";
  let bgClasses = "";

  if (theme === "dark") {
    // Para tema oscuro, usar fondo blanco en contenedores circulares
    if (variant === "circle" || variant === "circle-glow") {
      bgClasses = "bg-white text-gray-800";
    } else {
      bgClasses =
        "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100";
    }
  } else {
    bgClasses = "bg-gradient-to-br from-blue-600 to-green-600 text-white";
  }

  switch (variant) {
    case "circle":
      containerClasses = `logo-circle-white flex items-center justify-center`;
      break;
    case "circle-glow":
      containerClasses = `logo-circle-white-glow flex items-center justify-center`;
      break;
    default:
      containerClasses =
        "rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-300";
      break;
  }

  return (
    <div className={cn(sizeClass, containerClasses, bgClasses, className)}>
      <span className={cn("font-bold tracking-tight", textSizes[size])}>
        RJD
      </span>
    </div>
  );
}

// Hook para usar el logo en diferentes contextos
export function useLogo(theme: "light" | "dark" = "dark") {
  return {
    Logo: (props: Omit<LogoProps, "theme">) => (
      <Logo {...props} theme={theme} />
    ),
    LogoFallback: (
      props: Omit<Parameters<typeof LogoFallback>[0], "theme">
    ) => <LogoFallback {...props} theme={theme} />,
  };
}
