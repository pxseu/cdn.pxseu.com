import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type cdnDocument = Document & {
	userId: number;
	fileName: string;
	fileUrl: string;
	uploadDate: number;
};

const cdnSchema = new Schema({
	userId: {
		type: Number,
	},
	fileName: {
		type: String,
	},
	fileUrl: {
		type: String,
	},
	uploadDate: {
		type: Number,
		default: Date.now(),
	},
});

export default mongoose.model("cdnFile", cdnSchema);
