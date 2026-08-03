import { Button } from "react-email";

export function CtaButton({
  children,
  href,
  backgroundColor = "#000000",
  color = "#ffffff",
  border = "none",
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor,
        border,
        color,
        height: "36px",
        lineHeight: "36px",
        textAlign: "center",
        width: "160px",
      }}
    >
      {children}
    </Button>
  );
}
