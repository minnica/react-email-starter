import { Text, Hr } from "react-email";
import { CtaSection } from "./CtaSection";
import { uLatinaTheme } from "../universidades/themes/uLatina";
import { uLatinaCtaVariants } from "../universidades/data/uLatina";

export function CtaSectionPreview() {
  return (
    <>
      {uLatinaCtaVariants.map(
        ({ label, variant, sizeTitle, title, description, primaryButton, secondaryButton }) => (
          <div key={label}>
            <Text style={{ fontWeight: 600 }}>{label}</Text>
            <CtaSection
              variant={variant}
              sizeTitle={sizeTitle}
              title={title}
              description={description}
              primaryButton={{ ...uLatinaTheme.primaryButton, ...primaryButton }}
              secondaryButton={
                secondaryButton
                  ? { ...uLatinaTheme.secondaryButton, ...secondaryButton }
                  : undefined
              }
            />
             <Hr />
          </div>
         
        )
      )}
    </>
  );
}

export default CtaSectionPreview;
