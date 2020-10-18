require("dotenv").config();

const port = process.env.PORT || 5000;
const errorPages = ["404_1.html", "404_2.html"];

const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const imageSize = require("image-size");
const mongoose = require("mongoose");
const mime = require("mime-types");
const express = require("express");
const isbot = require("isbot");
const cors = require("cors");
const fs = require("fs");

const cdnV1 = require("./routes/v1");
const gfDetector = require("./routes/gf");

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
});
//start mongodb

mongoose.connection.on("error", (error) => console.error(error));
mongoose.connection.once("open", () => console.log("Connected to database"));

app.set("view engine", "ejs");
app.set("trust-proxy", 1);
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use(
	express.urlencoded({
		extended: false,
	})
);

app.use("/v1", cdnV1);
app.use(favicon(__dirname + "/www/images/favicon.ico"));

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

app.use(gfDetector);

app.use((req, res, next) => {
	const path = `${__dirname}/cdn${req.path}`;

	fs.access(path, fs.F_OK, (err) => {
		if (err) {
			next();
			return;
		}

		if (isbot(req.get("user-agent"))) {
			const fullUrl = `${req.protocol}://${req.get("host")}${req.path}`;

			if (req.query.raw != undefined) {
				res.sendFile(path);
				return;
			}

			const mimetype = mime.lookup(path);
			let filetype = mimetype.match(/.*\//gi)[0];
			filetype = filetype.replace("/", "");

			switch (filetype) {
				case "image":
					const dimensions = imageSize(path);

					res.render("openGraph-image.ejs", {
						filePath: fullUrl,
						fileType: mimetype,
						width: dimensions.width,
						height: dimensions.height,
					});
					return;
				//case "video":
				//	res.render("openGraph-video.ejs", {
				//		filePath: fullUrl,
				//		fileType: mimetype,
				//	});
				//	return;
				default:
					res.sendFile(path);
					return;
			}
		}

		res.sendFile(path);
	});
});

app.use((req, res) => {
	res.status(404);

	// respond with html page
	if (req.accepts("html")) {
		res.sendFile(
			__dirname +
				"/www/errors/" +
				errorPages[Math.floor(Math.random() * errorPages.length)]
		);
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

app.listen(port, "localhost", () => {
	console.log("Listening on port: " + port);
});
