import homepage from "./index.html";

const port = process.env.PORT || 3000;

Bun.serve({
  routes: {
    "/": homepage,
    "/app": homepage,
    "/connect": homepage,
    "/leak": homepage,
    "/frontend/*": (req) => {
      const path = req.url.split("/").pop();
      return new Response(Bun.file(`./frontend/${path}`));
    },
    "/dist/*": (req) => {
      const path = req.url.split("/").pop();
      return new Response(Bun.file(`./dist/${path}`));
    }
  },
  development: {
    hmr: true,
    console: true,
  },
  port: Number(port),
});

console.log(`Shadow CFO running at http://localhost:${port}`);
