import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type cdnDocument = Document & {
	userId: number;
	fileName: string;
	fileUrl: string;
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
});

export default mongoose.model("cdnFile", cdnSchema);
