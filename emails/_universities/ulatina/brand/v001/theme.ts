import type { EmailBrand } from "@email/types/email";

export const uLatinaBrandV001 = {
  id: "ulatina/v001",
  name: "Universidad Latina",
  font: {
    family: "Open Sans",
    fallback: "Arial",
    url: "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2",
    format: "woff2",
  },
  bodyStyle: {
    backgroundColor: "#ffffff",
    fontFamily: "Open Sans, Arial, sans-serif",
  },
  containerStyle: {
    margin: "0 auto",
    maxWidth: "600px",
  },
  primaryButton: {
    backgroundColor: "#000000",
    color: "#ffffff",
    width: "160px",
    height: "36px",
    lineHeight: "36px",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    color: "#000000",
    border: "1px solid #000000",
    width: "160px",
    height: "36px",
    lineHeight: "36px",
  },
} satisfies EmailBrand;
