import handler from "vinext/server/fetch-handler";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    // These headers are only trustworthy behind Sites, never on workers.dev.
    const headers = new Headers(request.headers);
    for (const name of Array.from(headers.keys())) {
      if (name.startsWith("oai-authenticated-user-")) headers.delete(name);
    }
    return handler.fetch(new Request(request, { headers }), env, ctx);
  },
};

export default worker;
