export async function GET() {
  const body = [
    "# UnboundKeyword LLM Access Policy",
    "",
    "Site: https://unboundkeyword.com",
    "Owner: UnboundKeyword",
    "",
    "Allowed:",
    "- Public marketing pages",
    "- Public blog pages",
    "",
    "Disallowed:",
    "- Authenticated dashboard pages",
    "- User-generated private keyword data",
    "- Admin and superadmin pages",
    "",
    "Contact: hello@unboundkeyword.com",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
