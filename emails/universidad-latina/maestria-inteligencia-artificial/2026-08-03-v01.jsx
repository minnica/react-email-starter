import { Column, Heading, Row, Section, Text } from "react-email";
import { CtaButton } from "../../_shared/CtaButton";
import { EmailShell } from "../../_shared/EmailShell";

const email = {
  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget lorem posuere, mollis lacus non, tempus nibh. Aenean scelerisque velit vitae consectetur porta.",
  primaryButton: {
    text: "CTA Principal",
    href: "https://online.ulatina.cr/masters/inteligencia-artificial/",
  },
  secondaryButton: {
    text: "CTA Principal",
    href: "https://api-wa",
  },
};

export default function MaestriaInteligenciaArtificialV01() {
  return (
    <EmailShell preview={email.title}>
      <Section style={styles.section}>
        <Heading as="h2" style={styles.heading}>
          {email.title}
        </Heading>
        <Text style={styles.text}>{email.description}</Text>

        <Row>
          <Column style={styles.centeredColumn}>
            <CtaButton href={email.primaryButton.href}>
              {email.primaryButton.text}
            </CtaButton>
          </Column>
        </Row>
        <Row style={styles.secondaryRow}>
          <Column style={styles.centeredColumn}>
            <CtaButton
              href={email.secondaryButton.href}
              backgroundColor="#ffffff"
              color="#000000"
              border="1px solid #000000"
            >
              {email.secondaryButton.text}
            </CtaButton>
          </Column>
        </Row>
      </Section>
    </EmailShell>
  );
}

const styles = {
  section: {
    padding: "32px 24px",
  },
  heading: {
    color: "#000000",
    fontSize: "24px",
    lineHeight: "32px",
    margin: "0 0 16px",
  },
  text: {
    color: "#333333",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 24px",
  },
  centeredColumn: {
    textAlign: "center",
  },
  secondaryRow: {
    marginTop: "12px",
  },
};
