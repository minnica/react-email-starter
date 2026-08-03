import type { CSSProperties, ReactNode } from "react";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type ButtonsDirection = "horizontal" | "vertical";
export type HorizontalAlignment = "left" | "center" | "right";
export type FallbackFont =
  | "Arial"
  | "Helvetica"
  | "Verdana"
  | "Georgia"
  | "Times New Roman"
  | "serif"
  | "sans-serif"
  | "monospace"
  | "cursive"
  | "fantasy";
export type FontFormat =
  | "woff"
  | "woff2"
  | "truetype"
  | "opentype"
  | "embedded-opentype"
  | "svg";

export interface ButtonTheme {
  backgroundColor: string;
  color: string;
  border?: string;
  width?: string;
  height?: string;
  lineHeight?: string;
  padding?: string;
}

export interface ButtonContent {
  text: string;
  href: string;
  hasIcon?: boolean;
  iconSrc?: string;
  iconPosition?: "left" | "right";
}

export type EmailButton = ButtonTheme & ButtonContent;

export interface CtaContent {
  headingLevel?: HeadingLevel;
  title?: string;
  description?: string;
  direction?: ButtonsDirection;
  primaryButton: ButtonContent;
  secondaryButton?: ButtonContent;
}

export interface EmailBrand {
  id: string;
  name: string;
  font: {
    family: string;
    fallback: FallbackFont | FallbackFont[];
    url?: string;
    format?: FontFormat;
  };
  bodyStyle: CSSProperties;
  containerStyle: CSSProperties;
  primaryButton: ButtonTheme;
  secondaryButton: ButtonTheme;
}

export interface EmailLayoutProps {
  brand: EmailBrand;
  preheader: string;
  children: ReactNode;
}
