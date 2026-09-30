import DOMPurify from "dompurify";

const allowedTags = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "a",
  "span",
  "div",
];

export function sanitizeHtml(value) {
  return DOMPurify.sanitize(String(value ?? ""), {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ["href", "target", "rel", "style"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "button", "link", "meta", "img"],
    FORBID_ATTR: ["src", "srcset"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|(?:\/|#))/i,
  });
}
