/**
 *  Copyright: pxseu.com
 *  Distributed for free to any user
 *  cdn.pxseu.com ONLINE SDK
 */

import type { _response, _requestTypes } from "../../custom";

(() => {
	if (typeof window === "undefined") return;

	window.cdn_pxseu = {
		init: ({ baseUrl, token }) => {
			window.cdn_pxseu.uploadFile = async (uploadElement) => {
				const body = new FormData();
				body.append("uploadFile", uploadElement.files[0]);

				const request = await _request({
					baseUrl,
					method: "POST",
					token,
					contentType: "multipart/form-data",
					body,
				});

				if (!request.success) {
					return {
						success: false,
						message: request.data.error ? request.data.error : request.data.message,
					};
				}
				return { success: true, message: request.data.message };
			};

			window.cdn_pxseu.deleteFile = async (fileUrl) => {
				const request = await _request({
					baseUrl,
					method: "DELETE",
					token,
					contentType: "application/json",
					body: {
						fileUrl,
					},
				});

				return { success: request.success };
			};

			window.cdn_pxseu.downloadShareX = () => {
				const filename = "cdn.pxseu.sxcu";
				const data = {
					Name: "cdn.pxseu.com",
					DestinationType: "ImageUploader, FileUploader",
					RequestType: "POST",
					RequestURL: `${baseUrl}/v1/files`,
					FileFormName: "uploadFile",
					Headers: {
						Authorization: `Bearer ${token}`,
					},
					ResponseType: "Text",
					URL: "$json:url$",
				};
				const element = document.createElement("a");
				element.setAttribute(
					"href",
					"data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
				);
				element.setAttribute("download", filename);
				element.style.display = "none";
				document.body.appendChild(element);
				element.click();
				document.body.removeChild(element);
			};

			async function _request({ baseUrl, method, body, token, contentType }: _requestTypes) {
				const request = await fetch(`https://${baseUrl}/v1/files`, {
					method: method,
					headers: {
						"Content-Type": contentType,
						Authorization: `Bearer ${token}`,
					},
					body: method != "GET" ? JSON.stringify(body) : null,
				});

				const parsedResponse: _response = await request.json();
				return parsedResponse;
			}
		},
	};

	console.log("Submit loaded! version 1.3");
})();
