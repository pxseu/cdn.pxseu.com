import { NextFunction, Request, Response, Router } from "express";
import fs from "fs";
import shortId from "shortid";
import User, { UserType } from "../db/models/user";
import Cdn from "../db/models/cdn";
import purgeCache from "../modules/cloudflare/purge";
import { CDN_BASE_URL, DEV_MODE } from "..";
import { codes } from "../utils/httpCodesMap";

const router = Router();

router.use((req, res, next) => {
	res.set("Cache-control", `no-store`);

	if (DEV_MODE || req.hostname == CDN_BASE_URL(req)) return next();

	res.status(400).json({
		success: false,
		status: res.statusCode,
		data: {
			message: codes.get(res.statusCode),
			error: `Invalid domain. Please use (${CDN_BASE_URL(req)})`,
		},
	});
});

router.get("/files", checkAuth, async (req, res) => {
	Cdn.find({
		userId: req.auth.id,
	}).then((files) => {
		res.json({ success: true, status: res.statusCode, data: { files } });
	});
});

router.post("/files", checkAuth, async (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0)
		return res.status(400).json({
			success: false,
			status: res.statusCode,
			data: { message: codes.get(res.statusCode), error: "No fies provided." },
		});

	const uploadFile = req.files.uploadFile ?? req.files.file;
	const re = /(?:\.([^.]+))?$/;
	const ext = re.exec(uploadFile.name)[1];
	const fileId = shortId.generate();
	const file = `${fileId}${ext == undefined ? "" : `.${ext}`}`;

	uploadFile.mv("./cdn/" + file, async (err) => {
		if (err) {
			console.error(err);
			return res.status(500).json({
				success: false,
				status: res.statusCode,
				data: { message: codes.get(res.statusCode) },
			});
		}
		try {
			await Cdn.create({
				userId: req.auth.id,
				fileName: uploadFile.name,
				fileUrl: file,
			});
			const resdata = {
				success: true,
				status: res.statusCode,
				data: {
					file,
					url: `http${DEV_MODE ? "" : "s"}://${req.hostname}/${file}#uwu`,
				},
			};
			if (req.accepts("json")) {
				res.json(resdata);
				return;
			}

			res.type("txt").send(JSON.stringify(resdata));
		} catch (e) {
			res.status(500).json({
				success: false,
				status: res.statusCode,
				data: {
					message: codes.get(res.statusCode),
				},
			});
		}
	});
});

router.delete("/files", checkAuth, async (req, res) => {
	const file = await req.body.fileUrl;

	const fileInDb = await Cdn.findOne({
		userId: req.auth.id,
		fileUrl: file,
	});

	if (!fileInDb)
		return res.status(404).json({
			success: false,
			status: res.statusCode,
			data: { message: codes.get(res.statusCode) },
		});
	fs.unlink("./cdn/" + file, async (err) => {
		if (err) {
			console.error(err);
			res.status(500).json({
				success: false,
				status: res.statusCode,
				data: {
					message: codes.get(res.statusCode),
				},
			});
			return;
		}
		fileInDb.deleteOne().then(async () => {
			const cfCache = await purgeCache(file, CDN_BASE_URL(req));

			res.json({
				success: true,
				status: res.statusCode,
				data: {
					deletedUrl: file,
					cachePurged: cfCache.success,
				},
			});
		});
	});
});

router.get("/", (_, res) => {
	const routes: string[] = [];

	router.stack.forEach((c) => {
		if (!c.route) return;
		routes.push(`${Object.keys(c.route.methods).map((m) => m.toUpperCase())} ${c.route.path}`);
	});

	res.json({ success: true, status: res.statusCode, data: { routes } });
});

router.use((_, res) => {
	res.status(404).json({
		success: false,
		status: res.statusCode,
		data: {
			message: codes.get(res.statusCode),
		},
	});
});

export default router;

async function checkAuth(req: Request, res: Response, next: NextFunction) {
	const token = extractToken(req);
	if (token == null)
		return res.status(401).json({
			success: false,
			status: res.statusCode,
			data: { message: codes.get(res.statusCode) },
		});

	const dbUser = (await User.findOne({
		"cdn.token": token,
	})) as UserType;

	if (dbUser == undefined || dbUser.cdn.allow == false)
		return res.status(401).json({
			success: false,
			status: res.statusCode,
			data: {
				message: codes.get(res.statusCode),
			},
		});

	req.auth = dbUser;
	next();
}

function extractToken(req: Request): string | null {
	if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
		return req.headers.authorization.split(" ")[1];
	} else if (req.query && req.query.token) {
		return req.query.token.toString();
	} else if (req.body && req.body.token) {
		return req.body.token;
	}

	return null;
}
