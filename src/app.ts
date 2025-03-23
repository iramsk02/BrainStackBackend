// filepath: d:\Iram\WorkSpace\SecondBrain\src\app.ts
import express, { NextFunction } from 'express';
import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import path from 'path'
import crypto from 'crypto'
import authenticateToken from './middleware';
import JWT_SECRET from './config';
import cors from 'cors';
import { User, myLink, Tag, Content } from "./Schema";

const app = express();
const port=process.env.port;


// Middleware
app.use(cors());
app.use(bodyParser.json());



if (!process.env.MongoDB_URL) {
  throw new Error('MongoDB_URL is not defined in the environment variables');
}

mongoose.connect(process.env.MongoDB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1); // Exit the process with a failure code
  });



//Middleware to verify JWT token


app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));

})

//signup
app.post('/api/v1/signup', async (req: Request, res: Response): Promise<void> => {

  const { username, password } = req.body;
  

  //validatepassword 
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,20}$/;



  if (!passwordRegex.test(password)) {
    res.status(400).send({ message: "Password must be 8-20 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
    return;
  }

  try {

    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(403).send({ message: "User already exists" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(200).send({ message: "User signed in successfully" })

  } catch (error: any) {

    res.status(500).send({ message: "server error" })


  }

});

//signin
app.post('/api/v1/signin', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

 

  if (!username || !password) {
    res.status(400).send({ message: "Username and password are required" });
    return;
  }


  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }
    //@ts-ignore
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      res.status(401).send({ message: "invalid password" })
      return;
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.status(200).send({ message: "user signed In successfully", token: token, username: username })

  }
  catch (error) {
    res.status(500).send({ message: "server error", error: error });


  }
});


//addcontent
app.post('/api/v1/addcontent', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { link, type, title, data, tags, username } = req.body;


    const user = await User.findOne({ username:username});
    const tagDocs = await Tag.find({ title: { $in: tags } });
    // const tagIds = tagDocs.map(tags => tags._id);
    const tagIds = [];
    for (const tag of tags) {
      let tagDoc = await Tag.findOne({ title: tag });
      if (!tagDoc) {
        tagDoc = new Tag({ title: tag });
        await tagDoc.save();
      }
      tagIds.push(tagDoc._id);
    }




    if (!type || !title) {
      res.status(400).json({ message: "Missing required fields: type or title" });
      return;
    }
    const allowedtypes = ["image", "video", "article", "audio", "pdf", "text","twitter"]
    if (!allowedtypes.includes(type)) {
      res.status(400).json({ message: "Invalid content type" });
      return;
    }
    const newcontent = new Content({
      link: link ,
      type: type||"default",
      title: title || "doc",
      data: data ,
      //@ts-ignore
      userId: user._id,
      tags: tagIds,

    })
    await newcontent.save()
    res.status(201).json({ message: "Content posted successfully", content: newcontent });

    return
  }
  catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
    return
  }



});

//  Get Content Route
app.get('/api/v1/content', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const username = req.query.username as string;


  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.status(404).send({ message: 'User not found' });
      return;
    }

    const userContent = await Content.find({ userId: user._id }).populate('tags');
    if (!userContent.length) {
      res.status(404).json({ message: 'No content found for this user.' });
      return;
    }

    res.status(200).json({ message: 'User content fetched successfully', content: userContent });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//Delete Content Route 
app.delete('/api/v1/content/', authenticateToken, async (req: Request, res: Response) => {
  const contentid = req.body.contentid;


  try {
    const content = await Content.findByIdAndDelete(contentid);
    if (!content) {
      res.status(404).send({ message: "Content not found" });
      return;
    }
    res.status(200).send({ message: "Content deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }

});

//Share Brain Route 
app.post('/api/v1/brain/share', authenticateToken, async (req: Request, res: Response) => {

  const { contentid, username } = req.body;


  if (!contentid) {
    res.status(400).json({ message: "Content ID is required" });
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const contentExists = await Content.findOne({_id:contentid, userId: user._id });
   
    if (!contentExists) {
  
      res.status(400).json({ message: "content ID is invalid" });
      return;
    }


    const shareableLink = crypto.randomBytes(16).toString('hex');
  
    const sharedContent = new myLink({
      hash:shareableLink,
      userId: user._id,
      contentId:contentid
     
    });
    await sharedContent.save();
    res.status(200).json({ message: "Brain shared successfully", shareableLink });

  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", err });

  }
});



//  Fetch Shared Brain Route
app.get('/api/v1/brain/:sharedlink', async (req: Request, res: Response) => {
  const { sharedlink } = req.params;



  try {
    

    const sharedContent = await myLink.findOne({ hash: sharedlink });

    if (!sharedContent) {
      res.status(404).json({ message: "Shared content not found" });
      return;
    }
    const content = await Content.findById(sharedContent.contentId);
    if (!content) {
      res.status(404).json({ message: "Content not found" });
      return;
    }
    res.status(200).json({ message: "Content fetched successfully", content });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", err });

  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
