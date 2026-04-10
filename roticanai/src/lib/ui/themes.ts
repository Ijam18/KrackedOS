/**
 * Editor themes
 *
 * Monaco editor theme definitions
 */

export const githubDarkTheme = {
  name: "github-dark",
  type: "dark" as const,
  colors: {
    "editor.foreground": "#f6f8fa",
    "editor.background": "#24292e",
    "editor.selectionBackground": "#4c2889",
    "editor.inactiveSelectionBackground": "#444d56",
    "editor.lineHighlightBackground": "#444d56",
    "editorCursor.foreground": "#ffffff",
    "editorWhitespace.foreground": "#6a737d",
    "editorIndentGuide.background": "#6a737d",
    "editorIndentGuide.activeBackground": "#f6f8fa",
    "editor.selectionHighlightBorder": "#444d56",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: "#959da5" },
    },
    {
      scope: [
        "constant",
        "entity.name.constant",
        "variable.other.constant",
        "variable.language",
      ],
      settings: { foreground: "#c8e1ff" },
    },
    { scope: ["entity", "entity.name"], settings: { foreground: "#b392f0" } },
    {
      scope: ["variable.parameter.function"],
      settings: { foreground: "#f6f8fa" },
    },
    { scope: ["entity.name.tag"], settings: { foreground: "#7bcc72" } },
    {
      scope: ["keyword", "storage", "storage.type"],
      settings: { foreground: "#ea4a5a" },
    },
    {
      scope: [
        "storage.modifier.package",
        "storage.modifier.import",
        "storage.type.java",
      ],
      settings: { foreground: "#f6f8fa" },
    },
    {
      scope: [
        "string",
        "punctuation.definition.string",
        "string punctuation.section.embedded source",
      ],
      settings: { foreground: "#79b8ff" },
    },
    {
      scope: ["support", "meta.property-name"],
      settings: { foreground: "#c8e1ff" },
    },
    { scope: ["variable"], settings: { foreground: "#fb8532" } },
    { scope: ["variable.other"], settings: { foreground: "#f6f8fa" } },
    {
      scope: ["invalid.broken", "invalid.deprecated"],
      settings: { foreground: "#d73a49", fontStyle: "bold italic underline" },
    },
    {
      scope: ["invalid.illegal", "carriage-return"],
      settings: {
        foreground: "#fafbfc",
        background: "#d73a49",
        fontStyle: "italic underline",
      },
    },
    {
      scope: ["invalid.unimplemented"],
      settings: { foreground: "#d73a49", fontStyle: "bold italic underline" },
    },
    { scope: ["message.error"], settings: { foreground: "#d73a49" } },
    { scope: ["string source"], settings: { foreground: "#f6f8fa" } },
    { scope: ["string variable"], settings: { foreground: "#c8e1ff" } },
    {
      scope: [
        "source.regexp",
        "string.regexp",
        "string.regexp.character-class",
        "string.regexp constant.character.escape",
        "string.regexp source.ruby.embedded",
        "string.regexp string.regexp.arbitrary-repitition",
      ],
      settings: { foreground: "#79b8ff" },
    },
    {
      scope: ["string.regexp constant.character.escape"],
      settings: { foreground: "#7bcc72", fontStyle: "bold" },
    },
    {
      scope: ["support.constant", "support.variable", "meta.module-reference"],
      settings: { foreground: "#c8e1ff" },
    },
    { scope: ["markup.list"], settings: { foreground: "#fb8532" } },
    {
      scope: ["markup.heading", "markup.heading entity.name"],
      settings: { foreground: "#0366d6", fontStyle: "bold" },
    },
    { scope: ["markup.quote"], settings: { foreground: "#c8e1ff" } },
    {
      scope: ["markup.italic"],
      settings: { foreground: "#f6f8fa", fontStyle: "italic" },
    },
    {
      scope: ["markup.bold"],
      settings: { foreground: "#f6f8fa", fontStyle: "bold" },
    },
    { scope: ["markup.raw"], settings: { foreground: "#c8e1ff" } },
    {
      scope: [
        "markup.deleted",
        "meta.diff.header.from-file",
        "punctuation.definition.deleted",
      ],
      settings: { foreground: "#b31d28", background: "#ffeef0" },
    },
    {
      scope: [
        "markup.inserted",
        "meta.diff.header.to-file",
        "punctuation.definition.inserted",
      ],
      settings: { foreground: "#176f2c", background: "#f0fff4" },
    },
    {
      scope: ["markup.changed", "punctuation.definition.changed"],
      settings: { foreground: "#b08800", background: "#fffdef" },
    },
    {
      scope: ["markup.ignored", "markup.untracked"],
      settings: { foreground: "#2f363d", background: "#959da5" },
    },
    {
      scope: ["meta.diff.range"],
      settings: { foreground: "#b392f0", fontStyle: "bold" },
    },
    { scope: ["meta.diff.header"], settings: { foreground: "#c8e1ff" } },
    {
      scope: ["meta.separator"],
      settings: { foreground: "#0366d6", fontStyle: "bold" },
    },
    { scope: ["meta.output"], settings: { foreground: "#0366d6" } },
    {
      scope: [
        "brackethighlighter.tag",
        "brackethighlighter.curly",
        "brackethighlighter.round",
        "brackethighlighter.square",
        "brackethighlighter.angle",
        "brackethighlighter.quote",
      ],
      settings: { foreground: "#ffeef0" },
    },
    {
      scope: ["brackethighlighter.unmatched"],
      settings: { foreground: "#d73a49" },
    },
    {
      scope: ["sublimelinter.mark.error"],
      settings: { foreground: "#d73a49" },
    },
    {
      scope: ["sublimelinter.mark.warning"],
      settings: { foreground: "#fb8532" },
    },
    {
      scope: ["sublimelinter.gutter-mark"],
      settings: { foreground: "#6a737d" },
    },
    {
      scope: ["constant.other.reference.link", "string.other.link"],
      settings: { foreground: "#79b8ff", fontStyle: "underline" },
    },
  ],
};
