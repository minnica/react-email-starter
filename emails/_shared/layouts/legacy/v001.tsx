import { Body, Font, Head, Html } from "react-email";
import type { EmailLayoutProps } from "@email/types/email";

export function LegacyLayout({ brand, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        {brand.font.url ? (
          <Font
            fontFamily={brand.font.family}
            fallbackFontFamily={brand.font.fallback}
            webFont={{
              url: brand.font.url,
              format: brand.font.format ?? "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        ) : null}
      </Head>
      <Body>{children}</Body>
    </Html>
  );
}
