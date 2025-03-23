"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//@ts-ignore
const config_1 = __importDefault(require("./config"));
function authenticateToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        res.status(401).send({ message: "Token missing" });
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.default, (err, user) => {
        if (err) {
            res.status(403).json({ message: "Invalid or expired token" });
            return;
        }
        next();
    });
}
