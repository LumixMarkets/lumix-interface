import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 38,
  height: 38,
};

export const contentType = "image/png";
export const runtime = "nodejs";

export default async function LumixIcon() {
  const logo = await readFile(join(process.cwd(), "design-system", "assets", "lumix-logo-icon-white.png"));
  const logoSource = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div style={{ width: 32, height: 40, display: "flex" }}>
          <img src={logoSource} alt="" width="100%" height="100%" style={{ objectFit: "contain" }} />
        </div>
      </div>
    ),
    size,
  );
}
