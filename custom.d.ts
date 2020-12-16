import { UserType } from "./src/db/models/user";

declare global {
	namespace Express {
		export interface Request {
			auth: UserType;
		}
	}
}
