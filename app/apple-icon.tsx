import { ImageResponse } from "next/og";
import { LOGO_MARK_DATA_URL } from "@/app/components/brandAssets";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <img src={LOGO_MARK_DATA_URL} width={116} height={129} alt="" />
      </div>
    ),
    { ...size }
  );
}
