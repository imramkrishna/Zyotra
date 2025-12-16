import { Elysia } from "elysia";
import routes from "./routes";
import { config } from "dotenv";
import checkAuthPlugin from "./middlewares/checkAuth";
import { cors } from "@elysiajs/cors";
config();
const app = new Elysia()
const allowedOrigins=[
  'http://localhost:5173',
  'https://zyotraportal.ramkrishna.cloud'
]
app.use(cors({
  origin:allowedOrigins,
  credentials: true,
}))
routes.forEach(route => {
  route.isProtected ?
    app.use(
      new Elysia()
        .use(checkAuthPlugin)
        .route(route.method, route.path, route.handler)
    )
    :
    app.route(route.method, route.path, route.handler)
})
app.listen(Number(process.env.PORT));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
