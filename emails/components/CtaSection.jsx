import { Section, Heading, Text } from "react-email";
import { CtaButton } from "../components/CtaButton";

export function CtaSection({ variant, sizeTitle, title, description, primaryButton, secondaryButton }) {
  return (
    <Section>
      {title ? <Heading as={sizeTitle}>{title}</Heading> : null}
      {description ? <Text>{description}</Text> : null}

      <CtaButton
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        buttonsDirection={variant}
        buttonsAlign="center"
        buttonsGap="12px"
      />
    </Section>
  );
}
