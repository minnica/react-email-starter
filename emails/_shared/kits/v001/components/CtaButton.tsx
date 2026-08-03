import { Button, Column, Img, Row } from "react-email";
import type {
  ButtonsDirection,
  EmailButton,
  HorizontalAlignment,
} from "@email/types/email";

function ButtonWithIcon({ button }: { button: EmailButton }) {
  const icon = button.hasIcon && button.iconSrc ? (
    <Img
      src={button.iconSrc}
      alt=""
      width="24"
      height="24"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        marginRight: button.iconPosition === "left" ? 8 : 0,
        marginLeft: button.iconPosition === "right" ? 8 : 0,
      }}
    />
  ) : null;

  return (
    <Button
      href={button.href}
      style={{
        color: button.color,
        padding: button.padding,
        backgroundColor: button.backgroundColor,
        border: button.border,
        width: button.width,
        height: button.height,
        textAlign: "center",
        lineHeight: button.lineHeight,
      }}
    >
      {button.iconPosition === "left" ? icon : null}
      {button.text}
      {button.iconPosition === "right" ? icon : null}
    </Button>
  );
}

interface CtaButtonProps {
  primaryButton: EmailButton;
  secondaryButton?: EmailButton;
  buttonsDirection?: ButtonsDirection;
  buttonsGap?: string;
  buttonsAlign?: HorizontalAlignment;
}

export function CtaButton({
  primaryButton,
  secondaryButton,
  buttonsDirection = "vertical",
  buttonsGap = "12px",
  buttonsAlign = "center",
}: CtaButtonProps) {
  const primaryButtonElement = <ButtonWithIcon button={primaryButton} />;
  const secondaryButtonElement = secondaryButton?.text ? (
    <ButtonWithIcon button={secondaryButton} />
  ) : null;

  if (!secondaryButtonElement) {
    return (
      <Row>
        <Column style={{ textAlign: buttonsAlign }}>{primaryButtonElement}</Column>
      </Row>
    );
  }

  if (buttonsDirection === "horizontal") {
    return (
      <Row align={buttonsAlign} width="auto">
        <Column style={{ textAlign: buttonsAlign }}>{primaryButtonElement}</Column>
        <Column style={{ width: buttonsGap, lineHeight: 0, fontSize: 0 }}>
          &nbsp;
        </Column>
        <Column style={{ textAlign: buttonsAlign }}>{secondaryButtonElement}</Column>
      </Row>
    );
  }

  return (
    <>
      <Row>
        <Column style={{ textAlign: buttonsAlign }}>{primaryButtonElement}</Column>
      </Row>
      <Row style={{ marginTop: buttonsGap }}>
        <Column style={{ textAlign: buttonsAlign }}>{secondaryButtonElement}</Column>
      </Row>
    </>
  );
}
