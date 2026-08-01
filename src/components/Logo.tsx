import logoAsset from "@/assets/stylisme-logo-v3.png.asset.json";

export function Logo({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Stylisme"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
