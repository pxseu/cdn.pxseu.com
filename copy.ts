/* 
    This is needed for valid setup lmao
    Never knew ts-node was this usefull
*/

import { cp, mkdir } from "shelljs";

cp("-R", "src/views", "dist/");
cp("-R", "src/www", "dist/");
mkdir("cdn");
