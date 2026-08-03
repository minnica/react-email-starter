import { Column, Heading, Hr, Row, Section, Text } from "react-email";
import { CtaButton } from "../../../_shared/CtaButton";
import { EmailShell } from "../../../_shared/EmailShell";

const primaryHref =
  "https://online.ulatina.cr/masters/inteligencia-artificial/";

const examples = [
  {
    label: "Vista previa de botón: vertical",
    direction: "vertical",
    title: "Lorem ipsum dolor sit amet, consectetur",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet mattis quam. Vestibulum lobortis dictum dolor.",
    secondary: true,
  },
  {
    label: "Vista previa de botón: horizontal",
    direction: "horizontal",
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget lorem posuere, mollis lacus non, tempus nibh. Aenean scelerisque velit vitae consectetur porta.",
    secondary: true,
  },
  {
    label: "Call-to-action 1",
    direction: "vertical",
  },
  {
    label: "Call-to-action 2",
    direction: "vertical",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet mattis quam. Vestibulum lobortis dictum dolor.",
  },
  {
    label: "Call-to-action 3",
    direction: "vertical",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet mattis quam. Vestibulum lobortis dictum dolor.",
    secondary: true,
  },
  {
    label: "Call-to-action 4",
    direction: "vertical",
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget lorem posuere, mollis lacus non, tempus nibh. Aenean scelerisque velit vitae consectetur porta.",
  },
  {
    label: "Call-to-action 5",
    direction: "horizontal",
    secondary: true,
  },
];

function Buttons({ direction, secondary }) {
  const primaryButton = (
    <CtaButton href={primaryHref}>CTA Principal</CtaButton>
  );
  const secondaryButton = secondary ? (
    <CtaButton
      href="https://api-wa"
      backgroundColor="#ffffff"
      color="#000000"
      border="1px solid #000000"
    >
      CTA Principal
    </CtaButton>
  ) : null;

  if (direction === "horizontal" && secondaryButton) {
    return (
      <Row align="center" width="auto">
        <Column style={styles.centeredColumn}>{primaryButton}</Column>
        <Column style={styles.horizontalGap}>&nbsp;</Column>
        <Column style={styles.centeredColumn}>{secondaryButton}</Column>
      </Row>
    );
  }

  return (
    <>
      <Row>
        <Column style={styles.centeredColumn}>{primaryButton}</Column>
      </Row>
      {secondaryButton ? (
        <Row style={styles.secondaryRow}>
          <Column style={styles.centeredColumn}>{secondaryButton}</Column>
        </Row>
      ) : null}
    </>
  );
}

function CtaExample({ description, direction, label, secondary, title }) {
  return (
    <Section style={styles.example}>
      <Text style={styles.label}>{label}</Text>
      {title ? (
        <Heading as="h2" style={styles.heading}>
          {title}
        </Heading>
      ) : null}
      {description ? <Text style={styles.text}>{description}</Text> : null}
      <Buttons direction={direction} secondary={secondary} />
      <Hr style={styles.divider} />
    </Section>
  );
}

export default function CatalogoCtaV01() {
  return (
    <EmailShell preview="Catálogo de variantes CTA de Universidad Latina">
      {examples.map((example) => (
        <CtaExample key={example.label} {...example} />
      ))}
    </EmailShell>
  );
}

const styles = {
  example: {
    padding: "24px",
  },
  label: {
    color: "#555555",
    fontSize: "14px",
    fontWeight: 600,
    margin: "0 0 16px",
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
  horizontalGap: {
    fontSize: 0,
    lineHeight: 0,
    width: "12px",
  },
  secondaryRow: {
    marginTop: "12px",
  },
  divider: {
    borderColor: "#dddddd",
    margin: "32px 0 0",
  },
};
