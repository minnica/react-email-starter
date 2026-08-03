import { CtaSection } from "./CtaSection";
import { uLatinaTheme } from "../universidades/themes/uLatina";
import { uLatinaData } from "../universidades/data/uLatina";

const primaryButton = { ...uLatinaTheme.primaryButton, ...uLatinaData.primaryButton };
const secondaryButton = { ...uLatinaTheme.secondaryButton, ...uLatinaData.secondaryButton };

export function CtaButtonPreview() {
  return (
    <>
      <CtaSection
        variant="vertical"
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        sizeTitle="h2"
        title="Lorem ipsum dolor sit amet, consectetur"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet mattis quam. Vestibulum lobortis dictum dolor."
      />

      <CtaSection
        variant="horizontal"
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        sizeTitle="h2"
        title="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget lorem posuere, mollis lacus non, tempus nibh. Aenean scelerisque velit vitae consectetur porta."
      />
    </>
  );
}

export default CtaButtonPreview;
