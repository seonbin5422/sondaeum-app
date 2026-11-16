import type { ImgHTMLAttributes } from "react";
// 시연 HTML용 next/image: 그냥 img (주소는 build.mjs가 data:로 바꿔 넣는다)
export default function Image({ priority: _p, fill: _f, quality: _q, placeholder: _ph, blurDataURL: _b, unoptimized: _u, ...rest }: ImgHTMLAttributes<HTMLImageElement> & Record<string, unknown>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...(rest as ImgHTMLAttributes<HTMLImageElement>)} />;
}
