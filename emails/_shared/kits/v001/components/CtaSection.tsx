import { Heading, Section, Text } from "react-email";
import type { CtaContent, EmailBrand } from "@email/types/email";
import { CtaButton } from "./CtaButton";

interface CtaSectionProps {
  brand: EmailBrand;
  content: CtaContent;
}

export function CtaSection({ brand, content }: CtaSectionProps) {
  const primaryButton = { ...brand.primaryButton, ...content.primaryButton };
  const secondaryButton = content.secondaryButton
    ? { ...brand.secondaryButton, ...content.secondaryButton }
    : undefined;

  return (
    <Section>
      {content.title ? (
        <Heading as={content.headingLevel ?? "h2"}>{content.title}</Heading>
      ) : null}
      {content.description ? <Text>{content.description}</Text> : null}

      <CtaButton
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        buttonsDirection={content.direction}
        buttonsAlign="center"
        buttonsGap="12px"
      />
    </Section>
  );
}
