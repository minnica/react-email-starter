import { Hr, Text } from "react-email";
import { CtaSection } from "@email/kits/v001";
import type { CtaContent } from "@email/types/email";
import { uLatinaBrandV001 } from "@universities/ulatina/brand/v001/theme";

const variants: Array<{ label: string; content: CtaContent }> = [
  {
    label: "CTA vertical con dos botones",
    content: {
      headingLevel: "h2",
      title: "Conoce nuestra oferta académica",
      description: "Explora los programas disponibles y solicita más información.",
      direction: "vertical",
      primaryButton: { text: "Conoce más", href: "https://example.com" },
      secondaryButton: { text: "Contactar", href: "https://wa.me/50600000000" },
    },
  },
  {
    label: "CTA horizontal con dos botones",
    content: {
      headingLevel: "h2",
      title: "Da el siguiente paso",
      description: "Selecciona la opción que prefieras para continuar.",
      direction: "horizontal",
      primaryButton: { text: "Ver programa", href: "https://example.com/programa" },
      secondaryButton: { text: "Contactar", href: "https://wa.me/50600000000" },
    },
  },
];

export function CtaSectionPreview() {
  return (
    <>
      {variants.map(({ label, content }) => (
        <div key={label}>
          <Text style={{ fontWeight: 600 }}>{label}</Text>
          <CtaSection brand={uLatinaBrandV001} content={content} />
          <Hr />
        </div>
      ))}
    </>
  );
}

export default CtaSectionPreview;
