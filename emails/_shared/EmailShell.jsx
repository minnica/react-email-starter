import { Body, Container, Font, Head, Html, Preview } from "react-email";

const bodyStyle = {
  backgroundColor: "#f4f4f4",
  fontFamily: "'Open Sans', Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
};

export function EmailShell({ children, preview }) {
  return (
    <Html lang="es">
      <Head>
        <Font
          fontFamily="Open Sans"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}
