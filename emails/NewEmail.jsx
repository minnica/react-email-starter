import { Html, Body, Head, Font, Heading, Text } from "react-email";
import { CtaSection } from "./components/CtaSection";
import { uLatinaTheme } from "./universidades/themes/uLatina";
import { uLatinaData } from "./universidades/data/uLatina";

export function NewEmail() {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Open Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body>
        <CtaSection
          primaryButton={{ ...uLatinaTheme.primaryButton, ...uLatinaData.primaryButton }}
          secondaryButton={{ ...uLatinaTheme.secondaryButton, ...uLatinaData.secondaryButton }}
          sizeTitle={uLatinaData.sizeTitle}
          title={uLatinaData.title}
          description={uLatinaData.description}
          variant={uLatinaData.variant}
        ></CtaSection>
        
      </Body>
    </Html>
  );
}

export default NewEmail;
