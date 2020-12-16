import { NextFunction, Request, Response, Router } from "express";
import fs from "fs";
import shortId from "shortid";
import User, { UserType } from "../db/models/user";
import Cdn from "../db/models/cdn";
import { DEV_MODE } from "..";

const router = Router();

router.get("/files", checkAuth, async (req, res) => {
	Cdn.find({
		userId: req.auth.id,
	}).then((data) => {
		res.json(data);
	});
});

router.post("/files", checkAuth, async (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0)
		return res.status(400).json({ error: "No files were uploaded." });

	const uploadFile = req.files.uploadFile || req.files.file;
	const re = /(?:\.([^.]+))?$/;
	const ext = re.exec(uploadFile.name)[1];
	const fileId = shortId.generate();
	let file: string;
	if (ext == undefined) {
		file = fileId;
	} else {
		file = fileId + "." + ext;
	}
	uploadFile.mv("./cdn/" + file, async (err) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ success: false });
		}
		try {
			await Cdn.create({
				userId: req.auth.id,
				fileName: uploadFile.name,
				fileUrl: file,
			});

			if (req.accepts("json")) {
				res.json({
					success: true,
					file,
					url: `http${DEV_MODE ? "" : "s"}://${req.hostname}/${file} uwu`,
				});
				return;
			}

			res.type("txt").send(
				`{ "success" : true, "file" : "${file}", url: "http${DEV_MODE ? "" : "s"}://${
					req.hostname
				}/${file} uwu" }`
			);
		} catch (e) {
			res.status(500).json({
				success: false,
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

	if (!fileInDb) return res.status(404).json({ error: "File not found." });
	fs.unlink("./cdn/" + file, async (err) => {
		if (err) {
			console.error(err);
			res.status(500).json({
				success: false,
			});
			return;
		}
		fileInDb.deleteOne().then(() => {
			res.json({ success: true, deletedUrl: file });
		});
	});
});

router.use((_, res) => {
	res.status(404).json({
		success: false,
	});
});

export default router;

async function checkAuth(req: Request, res: Response, next: NextFunction) {
	const token = req.body.token || req.header("Authorization");

	if (token == undefined) return res.status(401).json({ error: "No token was provided." });

	const dbUser = (await User.findOne({
		"cdn.token": token,
	})) as UserType;

	if (dbUser == undefined || dbUser.cdn.allow == false)
		return res.status(401).json({ error: "You're not allowed to use cdn." });

	req.auth = dbUser;
	next();
}
