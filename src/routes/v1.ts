import { Router } from "express";
import fs from "fs";
import shortId from "shortid";

import User, { UserType } from "../db/models/user";
import Cdn from "../db/models/cdn";
import { DEV_MODE } from "..";

const router = Router();

router.get("/files", async (req, res) => {
	const token = req.body.token || req.header("Authorization");

	if (token == undefined)
		return res.status(401).json({ error: "No token was provided." });

	const currentUser = (await User.findOne({
		"cdn.token": token,
	})) as UserType;

	if (currentUser == undefined || currentUser.cdn.allow == false)
		return res
			.status(401)
			.json({ error: "You're not allowed to use cdn." });

	await Cdn.find({
		userId: currentUser.id,
	}).then((data) => {
		res.json(data);
	});
});

router.post("/files", async (req, res) => {
	const token = req.body.token || req.header("Authorization");

	if (token == undefined)
		return res.status(401).json({ error: "No token was provided." });

	const currentUser = (await User.findOne({
		"cdn.token": token,
	})) as UserType;

	if (currentUser == undefined || currentUser.cdn.allow == false)
		return res
			.status(401)
			.json({ error: "You're not allowed to use cdn." });
	if (!req.files || Object.keys(req.files).length === 0)
		return res.status(400).json({ error: "No files were uploaded." });

	console.log(req.files);

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
		if (err) return res.status(500).json({ error: err });
		new Cdn({
			userId: currentUser.id,
			fileName: uploadFile.name,
			fileUrl: file,
		})
			.save()
			.then(() => {
				const response =
					currentUser.name + " uploaded a file! Link: " + file;

				if (req.accepts("json")) {
					res.json({
						success: true,
						file,
						url: `http${DEV_MODE ? "" : "s"}://${
							req.hostname
						}/${file} uwu`,
					});
					return;
				}

				res.type("txt").send(
					`{ "success" : true, "file" : "${file}", url: "http${
						DEV_MODE ? "" : "s"
					}://${req.hostname}/${file} uwu" }`,
				);

				console.log(response);
			});
	});
});

router.delete("/files", async (req, res) => {
	const token = req.body.token || req.header("Authorization");

	if (token == undefined)
		return res.status(401).json({ error: "No token was provided." });

	const dbUser = (await User.findOne({
		"cdn.token": token,
	})) as UserType;

	if (dbUser == undefined || dbUser.cdn.allow == false)
		return res
			.status(401)
			.json({ error: "You're not allowed to use cdn." });

	const file = await req.body.fileUrl;

	const fileInDb = await Cdn.findOne({
		userId: dbUser.id,
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

export default router;
