import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import favicon from "serve-favicon";
import imageSize from "image-size";
import mimeTypes from "mime-types";
import { config } from "dotenv";
import express from "express";
import isbot from "isbot";
import cors from "cors";
import fs from "fs";

config();
export const DEV_MODE = process.env.NODE_ENV != "production";

import cdnV1 from "./routes/v1";
import gfDetector from "./routes/gf";
import { connect } from "./db";

const app = express();
const port = parseInt(process.env?.PORT) ?? 5000;

app.set("trust-proxy", 1);
app.set("views", "./dist/views");
app.set("view engine", "ejs");
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use(
	express.urlencoded({
		extended: false,
	}),
);

app.use("/v1", cdnV1);
app.use(favicon(__dirname + "/www/images/favicon.ico"));
app.use(gfDetector);

app.get("/", async (req, res) => {
	if (req.accepts("html")) {
		res.sendFile(__dirname + "/www/index.html");
		return;
	}

	if (req.accepts("json")) {
		res.send({ hi: "Welcome to my cdn. :))))" });
		return;
	}

	res.type("txt").send("Welcome to my cdn.");
});

app.use((req, res, next) => {
	const path = `${__dirname}/../cdn${req.path}`;

	fs.access(path, (err) => {
		if (err) {
			next();
			return;
		}

		if (isbot(req.headers["user-agent"])) {
			const fullUrl = `http${DEV_MODE ? "" : "s"}://${req.get("host")}${
				req.path
			}`;

			if (req.query.raw != undefined) {
				res.sendFile(req.path, { root: "./cdn" });
				return;
			}

			const mimetype = mimeTypes.lookup(path);

			let filetype = mimetype.toString().match(/.*\//gi)[0];
			filetype = filetype.replace("/", "");

			switch (filetype) {
				case "image": {
					const dimensions = imageSize(path);

					res.render("openGraph-image", {
						filePath: fullUrl,
						fileType: mimetype,
						width: dimensions.width,
						height: dimensions.height,
					});
					return;
				}
				//case "video":
				//	res.render("openGraph-video.ejs", {
				//		filePath: fullUrl,
				//		fileType: mimetype,
				//	});
				//	return;
				default: {
					res.sendFile(req.path, { root: "./cdn" });
					return;
				}
			}
		}

		res.sendFile(req.path, { root: "./cdn" });
	});
});

app.use((req, res) => {
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
