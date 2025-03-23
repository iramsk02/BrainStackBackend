"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Tag = exports.Content = exports.myLink = void 0;
const mongoose_1 = __importStar(require("mongoose"));
//User Schema
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 15,
        match: /^[a-zA-Z0-9]+$/ // Only alphanumeric characters
    },
    password: {
        type: String,
        required: true,
    }
});
const User = mongoose_1.default.model("User", userSchema);
exports.User = User;
//TAG Schema
const tagSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true, unique: true }
});
const Tag = mongoose_1.default.model("Tag", tagSchema);
exports.Tag = Tag;
//Content Schema
const contentTypes = ["image", "video", "article", "audio", "pdf", "text", "default", "twitter", "link"];
const contentSchema = new mongoose_1.Schema({
    link: { type: String },
    type: { type: String, enum: contentTypes, required: true },
    title: { type: String, required: true },
    data: { type: String },
    tags: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Tag' }],
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
});
const Content = mongoose_1.default.model("Content", contentSchema);
exports.Content = Content;
//Link Schema
const linkSchema = new mongoose_1.default.Schema({
    hash: { type: String, required: true },
    userId: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
    contentId: { type: mongoose_1.Types.ObjectId, ref: 'Content', required: true }
});
const myLink = mongoose_1.default.model("Link", linkSchema);
exports.myLink = myLink;
