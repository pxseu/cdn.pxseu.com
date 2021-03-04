import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type cdnDocument = Document & {
	userId: number;
	fileName: string;
	fileUrl: string;
	uploadDate?: number;
	domain: string;
};

const cdnSchema = new Schema({
	userId: {
		type: Number,
		required: true,
	},
	fileName: {
		type: String,
		required: true,
	},
	fileUrl: {
		type: String,
		required: true,
	},
	domain: {
		type: String,
		required: true,
		default: "cdn.pxseu.com",
	},
	uploadDate: {
		type: Number,
		default: Date.now(),
	},
});

export default mongoose.model<cdnDocument>("cdnFile", cdnSchema);
