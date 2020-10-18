const router = require("express").Router();

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

module.exports = router;
