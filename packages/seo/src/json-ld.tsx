import type { Thing, WithContext } from "schema-dts";

interface JsonLdProps<T extends Thing> {
  code: WithContext<T>;
}

export function JsonLd<T extends Thing>({ code }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(code).replace(/</g, "\\u003c"),
      }}
    />
  );
}
