import { CtaSection } from "@email/kits/v001";
import { LegacyLayout } from "@email/layouts/legacy/v001";
import { uLatinaBrandV001 } from "@universities/ulatina/brand/v001/theme";

const content = {
  headingLevel: "h2",
  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget lorem posuere, mollis lacus non, tempus nibh. Aenean scelerisque velit vitae consectetur porta.",
  direction: "vertical",
  primaryButton: {
    text: "CTA Principal",
    href: "https://online.ulatina.cr/masters/inteligencia-artificial/",
  },
  secondaryButton: {
    text: "CTA Principal",
    href: "https://api-wa",
  },
};

export function Email() {
  return (
    <LegacyLayout
      brand={uLatinaBrandV001}
      preheader="Conoce más sobre la Maestría en Inteligencia Artificial."
    >
      <CtaSection brand={uLatinaBrandV001} content={content} />
    </LegacyLayout>
  );
}

export default Email;
