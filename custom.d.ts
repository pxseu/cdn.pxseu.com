import { UserType } from "./src/db/models/user";

export type _response = {
	success: boolean;
	status: number;
	data: {
		message: string;
		error?: string;
		/*eslint-disable */
		[propName: string]: any;
		/*eslint-enable */
	};
};

export type _requestTypes = {
	baseUrl: string;
	method: "GET" | "POST" | "DELETE";
	token: string;
	/*eslint-disable */
	body?: any;
	/*eslint-enable */
	contentType?: "application/json" | "multipart/form-data";
};
declare global {
	namespace Express {
		export interface Request {
			auth: UserType;
		}
	}
	interface Window {
		cdn_pxseu: {
			init: (config: { token: string; baseUrl: string }) => void;
			uploadFile?: (
				uploadElement: HTMLInputElement
			) => Promise<{
				success: boolean;
				message: string;
			}>;
			deleteFile?: (
				fileUrl: string
			) => Promise<{
				success: boolean;
			}>;
			downloadShareX?: () => void;
		};
	}
}
