import { Router } from "express";

const router = Router();

const gfPaths = [
	"peitho",
	"cutie",
	"honey",
	"bunny",
	"wifey",
	"meAndWifey",
	"meAndMyCutie",
	"loveYou",
	"meAndHer",
];

router.use((req, res, next) => {
	if (gfPaths.some((path) => `/${path}` == req.path)) {
		return res.redirect(`/meAndHer.jpg${req.query}`);
	}
	next();
});

export default router;
