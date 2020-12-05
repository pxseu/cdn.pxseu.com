import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type UserType = Document & {
	id: number;
	name: string;
	password: string;
	admin: boolean;
	shorturl: {
		token: string;
		allow: boolean;
		allowPrivate: boolean;
	};
	cdn: {
		allow: boolean;
		token: string;
	};
};

const userSchema = new Schema({
	id: Number,
	name: String,
	email: String,
	password: String,
	admin: Boolean,
	shorturl: {
		token: {
			type: String,
			default: "bruh",
		},
		allow: {
			type: Boolean,
			default: false,
		},
		allowPrivate: {
			type: Boolean,
			default: false,
		},
	},
	cdn: {
		allow: {
			type: Boolean,
			default: false,
		},
		token: {
			type: String,
			default: "",
		},
	},
});

export default mongoose.model("user", userSchema);
