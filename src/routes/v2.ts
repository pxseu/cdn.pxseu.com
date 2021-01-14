import { NextFunction, Request, Response, Router } from "express";
import { promises as fs } from "fs";
import shortId from "shortid";
import User, { UserType } from "../db/models/user";
import Cdn, { cdnDocument } from "../db/models/cdn";
import purgeCache from "../modules/cloudflare/purge";
import { CDN_BASE_URL, DEV_MODE } from "..";
import { codes } from "../utils/httpCodesMap";

const router = Router();
const domainRegex = /^((([a-z\d]|[a-z\d][a-z\d-]*[a-z\d])\.?)+loves\.moe|cdn\.pxseu\.com)$/gi;

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
	const files = (await Cdn.find({
		userId: req.auth.id,
	})) as cdnDocument[];

	res.json({ success: true, status: res.statusCode, data: { files } });
});

router.post("/files", checkAuth, async (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0)
		return res.status(400).json({
			success: false,
			status: res.statusCode,
			data: { message: codes.get(res.statusCode), error: "No fies provided." },
		});

	let uploadFile = req.files.uploadFile ?? req.files.file;
	if (Array.isArray(uploadFile)) {
		uploadFile = uploadFile[0];
	}
	const re = /(?:\.([^.]+))?$/,
		ext = re.exec(uploadFile.name)[1],
		fileId = shortId.generate(),
		file = `${fileId}${ext == undefined ? "" : `.${ext}`}`,
		domain = String(req.body.domain) == "" ? CDN_BASE_URL(req) : String(req.body.domain),
		testDomain = domainRegex.test(domain);

	if (!DEV_MODE && testDomain) {
		res.status(400).json({
			success: false,
			status: res.statusCode,
			data: {
				message: `Invalid domain in the domain filed. Should match: "${domainRegex}"`,
			},
		});
		return;
	}

	try {
		await uploadFile.mv(`./cdn/${file}`);
		await Cdn.create({
			userId: req.auth.id,
			fileName: uploadFile.name,
			fileUrl: file,
			domain,
		});
		const resdata = {
			success: true,
			status: res.statusCode,
			data: {
				file,
				url: `http${DEV_MODE ? "" : "s"}://${domain}/${file}#uwu`,
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
	try {
		await fs.unlink(`./cdn/${file}`);

		await fileInDb.deleteOne();

		const cfCache = await purgeCache(file, CDN_BASE_URL(req));

		res.json({
			success: true,
			status: res.statusCode,
			data: {
				deletedUrl: file,
				cachePurged: cfCache.success,
			},
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			status: res.statusCode,
			data: {
				message: codes.get(res.statusCode),
			},
		});
		return;
	}
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
	if (!token)
		return res.status(401).json({
			success: false,
			status: res.statusCode,
			data: { message: codes.get(res.statusCode) },
		});

	const dbUser = (await User.findOne({
		"cdn.token": token,
	})) as UserType;

	if (!dbUser || !dbUser.cdn.allow)
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
