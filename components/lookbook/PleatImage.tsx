import Image from "next/image";

/**
 * An image cut into vertical pleats. Each strip holds the full image offset by its
 * position; once unfolded, a seamless base image crossfades in over any sub-pixel gap.
 */
export function PleatImage({
  src,
  alt,
  pleats = 6,
  sizes,
  className = "",
  imgClassName = "object-contain",
  imgStyle,
}: {
  src: string;
  alt: string;
  pleats?: number;
  sizes: string;
  className?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
}) {
  return (
    <div className={`render relative flex overflow-hidden ${className}`} role="img" aria-label={alt}>
      {Array.from({ length: pleats }, (_, i) => (
        <div
          key={i}
          className="pleat relative h-full shrink-0 overflow-hidden"
          style={{
            width: i === pleats - 1 ? `${100 / pleats}%` : `calc(${100 / pleats}% + 1px)`,
            marginRight: i === pleats - 1 ? undefined : "-1px",
            transformOrigin: i % 2 ? "right center" : "left center",
          }}
          aria-hidden="true"
        >
          <div className="absolute inset-y-0" style={{ left: `${-i * 100}%`, width: `${pleats * 100}%` }}>
            <Image src={src} alt="" fill sizes={sizes} className={imgClassName} style={imgStyle} />
          </div>
          <span
            className="pleat-shade pointer-events-none absolute inset-0"
            style={{
              background:
                i % 2
                  ? "linear-gradient(90deg, rgb(255 255 255 / 0.14), rgb(0 0 0 / 0.12))"
                  : "linear-gradient(90deg, rgb(0 0 0 / 0.12), rgb(255 255 255 / 0.14))",
            }}
          />
        </div>
      ))}
      <Image src={src} alt="" fill sizes={sizes} className={`pleat-base pointer-events-none opacity-0 ${imgClassName}`} style={imgStyle} aria-hidden="true" />
    </div>
  );
}
