import { ImageResponse } from "next/og";
import { LOGO_MARK_DATA_URL } from "@/app/components/brandAssets";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 32,
        }}
      >
        <img src={LOGO_MARK_DATA_URL} width={124} height={138} alt="" />
      </div>
    ),
    { ...size }
  );
}
