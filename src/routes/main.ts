import { NextFunction, Request, Response, Router } from "express";
import { access } from "fs";
import isbot from "isbot";
import mimeTypes from "mime-types";
import { CDN_BASE_URL, DEV_MODE, PORT } from "..";
import Cdn, { cdnDocument } from "../db/models/cdn";
import { codes } from "../utils/httpCodesMap";
import cdnV2 from "./v2";

const router = Router();

router.get("/", domainCheck, async (req, res) => {
	if (req.accepts("html")) {
		res.sendFile("/index.html", { root: "./dist/www" });
		return;
	}

	if (req.accepts("json")) {
		res.json({ success: true, status: res.statusCode, data: { message: "Hi!" } });
		return;
	}

	res.type("txt").send("Hi!");
});

router.get("/favicon.ico", (_, res) => {
	res.sendFile("/favicon.ico", { root: "./dist/www/images/" });
});

router.use("/v1", domainCheck, (_, res) => {
	res.status(400).json({
		success: false,
		data: {
			message: codes.get(res.statusCode),
			error: "Depracated",
		},
	});
});

router.use("/v2", domainCheck, cdnV2);

router.use((req, res, next) => {
	if (req.method.toUpperCase() !== "GET") {
		next();
		return;
	}

	const reqPath = req.path;

	const path = `${__dirname}/../../cdn${reqPath}`;

	access(path, async (err) => {
		if (err) {
			next();
			return;
		}

		const fileInCdn = (await Cdn.findOne({ fileUrl: reqPath })) as cdnDocument;

		if (fileInCdn && fileInCdn.domain != req.get("host")) {
			res.redirect(`http${DEV_MODE ? "" : "s"}://${fileInCdn.domain}/${reqPath}`);
			return;
		}

		if (!isbot(req.headers["user-agent"]) || req.query.raw != undefined) {
			res.set("X-CDN", "pxseu");
			res.sendFile(req.path, { root: "./cdn" });
			return;
		}

		const fullUrl = `http${DEV_MODE ? "" : "s"}://${req.get("host")}${req.path}`;

		const mimetype = mimeTypes.lookup(path);

		let filetype = mimetype.toString().match(/.*\//gi)[0];
		filetype = filetype.replace("/", "");

		switch (filetype) {
			case "image": {
				res.set("X-CDN", "pxseu");
				res.render("openGraph-image", {
					filePath: fullUrl,
					domain: req.get("host"),
				});
				return;
			}

			case "video": {
				if (req.query.iframe != undefined) {
					/* turn off frameguard */
					res.removeHeader("X-Frame-Options");
					res.render("openGraph-iframe", {
						filePath: fullUrl,
						domain: req.get("host"),
					});
					return;
				}

				res.render("openGraph-video.ejs", {
					filePath: fullUrl,
					domain: req.get("host"),
				});
				return;
			}

			default: {
				res.set("X-CDN", "pxseu");
				res.sendFile(req.path, { root: "./cdn" });
				return;
			}
		}
	});
});

router.use(domainCheck, (req, res) => {
	res.set("Cache-control", `no-store`);

	res.status(404);

	// respond with html page
	if (req.accepts("html")) {
		res.sendFile("404.html", { root: "./dist/www/errors/" });
		return;
	}

	// respond with json

	if (req.accepts("json")) {
		res.json({
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

export default router;

function domainCheck(req: Request, res: Response, next: NextFunction) {
	const base_url = CDN_BASE_URL(req);

	if (req.hostname == base_url) {
		next();
		return;
	}

	res.redirect(301, `http${DEV_MODE ? "" : "s"}://${base_url}${DEV_MODE ? `:${PORT}` : ""}${req.path}`);
}
