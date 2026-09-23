import Image from "next/image";

export function BrandMark() {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className="brand-mark"
      height={512}
      src="/images/ktu-university-seal.png"
      width={512}
    />
  );
}
