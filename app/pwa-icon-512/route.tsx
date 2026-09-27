import { ImageResponse } from "next/og";
import { LOGO_MARK_DATA_URL } from "@/app/components/brandAssets";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          borderRadius: 80,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) requires a plain img element */}
        <img src={LOGO_MARK_DATA_URL} width={330} height={368} alt="" />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
