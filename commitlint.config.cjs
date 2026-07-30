module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "is-ascii": ({ header, body, footer }) => {
          const isAscii = (str) =>
            !str || [...str].every((character) => character.codePointAt(0) <= 0x7f);
          return [
            isAscii(header) && isAscii(body) && isAscii(footer),
            "Commit message must be in English (ASCII only)",
          ];
        },
      },
    },
  ],
  rules: {
    "is-ascii": [2, "always"],
    "header-max-length": [2, "always", 72],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};
