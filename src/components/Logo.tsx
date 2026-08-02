import logoDark from "@/assets/stylisme-logo-v3.png.asset.json";
import logoLight from "@/assets/stylisme-logo-white.png.asset.json";
import { useTheme } from "@/lib/theme";

export function Logo({ size = 96, className = "" }: { size?: number; className?: string }) {
  const { theme } = useTheme();
  return (
    <img
      src={theme === "dark" ? logoLight.url : logoDark.url}
      alt="Stylisme"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
