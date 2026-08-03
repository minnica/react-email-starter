import { Body, Container, Font, Head, Html, Preview } from "react-email";
import type { EmailLayoutProps } from "@email/types/email";

export function PromotionalLayout({ brand, preheader, children }: EmailLayoutProps) {
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
      <Preview>{preheader}</Preview>
      <Body style={brand.bodyStyle}>
        <Container style={brand.containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}
