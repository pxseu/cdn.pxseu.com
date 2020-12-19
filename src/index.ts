import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import favicon from "serve-favicon";
import { config } from "dotenv";
import express, { Request } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cdnV2 from "./routes/v2";
import { connect } from "./db";
import mainRouter from "./routes/main";
import { codes } from "./utils/httpCodesMap";

config();
const port = parseInt(process.env?.PORT) ?? 5000;
const app = express();

export const DEV_MODE = process.env.NODE_ENV != "production";
export const CDN_BASE_URL = (req: Request): string =>
	DEV_MODE ? `${req.hostname}${port}` : process.env.CDN_BASE_URL ?? req.hostname;

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

app.use((_, res, next) => {
	res.set("X-CUM", "sticky");
	res.set("X-pxseu", "cute");
	res.set("X-Peitho", "love <3");
	res.set("X-JelNiSlaw", "menel");
	next();
});

app.use("/v1", (_, res) => {
	res.status(301).json({
		success: false,
		data: {
			message: codes.get(res.statusCode),
			newUrl: "/v2",
		},
	});
});

app.use("/v2", cdnV2);

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
		res.status(404).json({
			success: false,
			data: {
				message: codes.get(res.statusCode),
			},
		});
		return;
	}

	// default to plain-text. send()
	res.type("txt").send(codes.get(res.statusCode));
});

(async () => {
	await connect();
	app.listen(port, () => {
		console.log("> Listening on port: " + port);
	});
})();
