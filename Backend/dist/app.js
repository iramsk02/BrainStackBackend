"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// filepath: d:\Iram\WorkSpace\SecondBrain\src\app.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const middleware_1 = __importDefault(require("./middleware"));
//@ts-ignore
const config_1 = __importDefault(require("./config"));
const cors_1 = __importDefault(require("cors"));
const Schema_1 = require("./Schema");
const app = (0, express_1.default)();
const port = 4005;
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
mongoose_1.default.connect('mongodb://localhost:27017/secondbrain')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1); // Exit the process with a failure code
});
//Middleware to verify JWT token
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
//signup
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    //validatepassword 
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,20}$/;
    if (!passwordRegex.test(password)) {
        res.status(400).send({ message: "Password must be 8-20 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
        return;
    }
    try {
        const userExists = yield Schema_1.User.findOne({ username });
        if (userExists) {
            res.status(403).send({ message: "User already exists" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = new Schema_1.User({ username, password: hashedPassword });
        yield newUser.save();
        res.status(200).send({ message: "User signed in successfully" });
    }
    catch (error) {
        res.status(500).send({ message: "server error" });
    }
}));
//signin
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send({ message: "Username and password are required" });
        return;
    }
    try {
        const user = yield Schema_1.User.findOne({ username });
        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        //@ts-ignore
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).send({ message: "invalid password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, config_1.default);
        res.status(200).send({ message: "user signed In successfully", token: token, username: username });
    }
    catch (error) {
        res.status(500).send({ message: "server error", error: error });
    }
}));
//addcontent
app.post('/api/v1/addcontent', middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { link, type, title, data, tags, username } = req.body;
        console.log(req.body);
        const user = yield Schema_1.User.findOne({ username: username });
        const tagDocs = yield Schema_1.Tag.find({ title: { $in: tags } });
        // const tagIds = tagDocs.map(tags => tags._id);
        const tagIds = [];
        for (const tag of tags) {
            let tagDoc = yield Schema_1.Tag.findOne({ title: tag });
            if (!tagDoc) {
                tagDoc = new Schema_1.Tag({ title: tag });
                yield tagDoc.save();
            }
            tagIds.push(tagDoc._id);
        }
        if (!type || !title) {
            res.status(400).json({ message: "Missing required fields: type or title" });
            return;
        }
        const allowedtypes = ["image", "video", "article", "audio", "pdf", "text", "twitter"];
        if (!allowedtypes.includes(type)) {
            res.status(400).json({ message: "Invalid content type" });
            return;
        }
        const newcontent = new Schema_1.Content({
            link: link,
            type: type || "default",
            title: title || "doc",
            data: data,
            //@ts-ignore
            userId: user._id,
            tags: tagIds,
        });
        yield newcontent.save();
        res.status(201).json({ message: "Content posted successfully", content: newcontent });
        return;
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
}));
//  Get Content Route
app.get('/api/v1/content', middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.query.username;
    try {
        const user = yield Schema_1.User.findOne({ username });
        // console.log(user)
        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }
        const userContent = yield Schema_1.Content.find({ userId: user._id }).populate('tags');
        // console.log(userContent)
        if (!userContent.length) {
            res.status(404).json({ message: 'No content found for this user.' });
            return;
        }
        res.status(200).json({ message: 'User content fetched successfully', content: userContent });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
//Delete Content Route 
app.delete('/api/v1/content/', middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentid = req.body.contentid;
    console.log(contentid);
    try {
        const content = yield Schema_1.Content.findByIdAndDelete(contentid);
        if (!content) {
            res.status(404).send({ message: "Content not found" });
            return;
        }
        res.status(200).send({ message: "Content deleted successfully" });
    }
    catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
}));
//Share Brain Route 
app.post('/api/v1/brain/share', middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contentid, username } = req.body;
    if (!contentid) {
        res.status(400).json({ message: "Content ID is required" });
        return;
    }
    try {
        const user = yield Schema_1.User.findOne({ username });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const contentExists = yield Schema_1.Content.findOne({ _id: contentid, userId: user._id });
        if (!contentExists) {
            console.log("Content does not exist");
            res.status(400).json({ message: "content ID is invalid" });
            return;
        }
        const shareableLink = crypto_1.default.randomBytes(16).toString('hex');
        const sharedContent = new Schema_1.myLink({
            hash: shareableLink,
            userId: user._id,
            contentId: contentid
        });
        yield sharedContent.save();
        res.status(200).json({ message: "Brain shared successfully", shareableLink });
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error", err });
    }
}));
// 50c2cfeec31ee5fee6c78250fa865efe
//  Fetch Shared Brain Route
app.get('/api/v1/brain/:sharedlink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedlink } = req.params;
    console.log(sharedlink);
    try {
        const sharedContent = yield Schema_1.myLink.findOne({ hash: sharedlink });
        console.log(sharedContent);
        if (!sharedContent) {
            res.status(404).json({ message: "Shared content not found" });
            return;
        }
        const content = yield Schema_1.Content.findById(sharedContent.contentId);
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }
        res.status(200).json({ message: "Content fetched successfully", content });
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error", err });
    }
}));
app.listen(port, () => console.log(`Listening on port ${port}`));
