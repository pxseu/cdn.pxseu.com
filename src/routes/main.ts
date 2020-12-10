import { Router } from "express";
import { access } from "fs";
import isbot from "isbot";
import imageSize from "image-size";
import mimeTypes from "mime-types";
import { DEV_MODE } from "..";

const router = Router();

router.get("/", async (req, res) => {
	if (req.accepts("html")) {
		res.sendFile("/index.html", { root: "./dist/www" });
		return;
	}

	if (req.accepts("json")) {
		res.send({ hi: "Welcome to my cdn. :))))" });
		return;
	}

	res.type("txt").send("Welcome to my cdn.");
});

router.use((req, res, next) => {
	const path = `${__dirname}/../../cdn${req.path}`;

	access(path, (err) => {
		if (err) {
			next();
			return;
		}

		if (!isbot(req.headers["user-agent"]) || req.query.raw != undefined) {
			res.sendFile(req.path, { root: "./cdn" });
			return;
		}

		const fullUrl = `http${DEV_MODE ? "" : "s"}://${req.get("host")}${
			req.path
		}`;

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
	});
});

export default router;
