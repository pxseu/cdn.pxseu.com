import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import favicon from "serve-favicon";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cdnV1 from "./routes/v1";
import gfDetector from "./routes/gf";
import { connect } from "./db";
import mainRouter from "./routes/main";

config();
export const DEV_MODE = process.env.NODE_ENV != "production";

const app = express();
const port = parseInt(process.env?.PORT) ?? 5000;

app.set("trust-proxy", 1);
app.set("views", "./dist/views");
app.set("view engine", "ejs");
app.use(cors());
app.use(helmet());
app.use(morgan(DEV_MODE ? "dev" : "common"));

app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'"],
			baseUri: ["'self'"],
			fontSrc: ["'self'", "https:", "data:"],
			frameAncestors: ["'self'"],
			imgSrc: ["'self'", "data:", "maxcdn.bootstrapcdn.com"],
			objectSrc: ["'none'"],
			scriptSrc: [
				"'self'",
				"ajax.cloudflare.com",
				"static.cloudflareinsights.com",
				"cdnjs.cloudflare.com",
				"maxcdn.bootstrapcdn.com",
			],
			scriptSrcAttr: ["'none'"],
			styleSrc: ["'self'", "https:", "'unsafe-inline'"],
			upgradeInsecureRequests: [],
			blockAllMixedContent: [],
		},
	})
);

app.use(bodyParser.json());
app.use(fileUpload());
app.use(
	express.urlencoded({
		extended: false,
	})
);

app.use("/v1", cdnV1);
app.use(gfDetector);

app.use((_, res, next) => {
	res.set("X-CUM", "sticky");
	res.set("X-pxseu", "cute");
	res.set("X-Peitho", "love <3");
	res.set("X-JelNiSlaw", "menel");
	next();
});

app.use((req, res, next) => {
	if (req.method == "GET") {
		res.set("Cache-control", `public, max-age=${365 * 24 * 60 * 60}`);
	} else {
		res.set("Cache-control", `no-store`);
	}

	next();
});

app.use(favicon(__dirname + "/www/images/favicon.ico"));
app.use(mainRouter);

app.use((req, res) => {
	res.set("Cache-control", `no-store`);

	res.status(404);

	// respond with html page
	if (req.accepts("html")) {
		res.sendFile(__dirname + "/www/errors/404.html");
		return;
	}

	// respond with json
	if (req.accepts("json")) {
		res.send({ error: "Not found" });
		return;
	}

	// default to plain-text. send()
	res.type("txt").send("Not found");
});

(async () => {
	await connect();
	app.listen(port, () => {
		console.log("> Listening on port: " + port);
	});
})();