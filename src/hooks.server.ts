import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ resolve, event }) => {
  const response = await resolve(event);

  /**
   * We return our response as usual, but we append two headers:
   * - Cross-Origin-Embedder-Policy: require-corp
   * - Cross-Origin-Opener-Policy: same-origin
   *
   * These headers make out document cross-origin-isolated, which means the
   * following restrictions are applied:
   * - window-level: ensures document cannot share a browsing context group with
   * documents outside of its own origin.
   * - resource-loading: prevents document from making cross-origin requests
   * arbitrarily.
   *
   * The document must be cross-origin-isolated in order to use
   * SharedArrayBuffer
   *
   * Dumping some reading here for future reference because I know i'll forget
   * about Spectre:
   * https://docs.google.com/document/d/1zDlfvfTJ_9e8Jdc8ehuV4zMEu9ySMCiTGMS9y0GU92k/
   * https://docs.google.com/presentation/d/1sadl7jTrBIECCanuqSrNndnDr82NGW1yyuXFT1Dc7SQ/
   */
  return new Response(response.body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
  }});
};
