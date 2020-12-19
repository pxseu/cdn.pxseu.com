import { CF_BASE_URL } from ".";
import fetch from "node-fetch";
import { DEV_MODE } from "../..";

type cfErros = {
	message: string;
	path: string[];
	extensions: {
		timestamp: string;
	};
};

type cfResponse = {
	success: boolean;
	errors: cfErros[] | [];
	messages: [];
	result: {
		id: string;
	};
};

const ConsoleMessage = (resJson: cfResponse) =>
	DEV_MODE
		? `\n>> CLOUDFLARE_API_RESPONSE\n${resJson}\n>> END CLOUDFLARE_API_RESPONSE\n`
		: `>> CLOUDFLARE_API_RESPONSE: PURGED: ${resJson.success}`;

async function purgeCache(file: string, hostname: string): Promise<cfResponse> {
	if (!process.env.CF_API || !process.env.CF_ZONE) {
		return { success: false, errors: [], messages: [], result: { id: "" } };
	}
	const response = await fetch(`${CF_BASE_URL}/zones/${process.env.CF_ZONE}/purge_cache`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.CF_API}`,
		},
		redirect: "follow",
		body: JSON.stringify({ files: [`https://${hostname}/${file}`] }),
	});
	const resJson = await response.json();
	console.log(ConsoleMessage(resJson));
	return resJson;
}

export default purgeCache;
