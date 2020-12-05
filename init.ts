/* 
    This is needed for valid setup lmao
    Never knew ts-node was this usefull
*/

import { cp, mkdir, test, ls } from "shelljs";

cp("-R", "src/views", "dist/");
cp("-R", "src/www", "dist/");

if (test("-d", "cdn")) {
	console.log(`> CDN exists with: ${ls("cdn").length} file(s)`);
} else {
	mkdir("cdn");
}
