import mongoose, { Schema, Document, Types } from "mongoose";

//User Schema


const userSchema: Schema = new mongoose.Schema({
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

const User = mongoose.model("User", userSchema);


//TAG Schema
const tagSchema: Schema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }
})
const Tag = mongoose.model("Tag", tagSchema);


//Content Schema
const contentTypes = ["image", "video", "article", "audio", "pdf","text","default","twitter","link"] as const;
type ContentType = typeof contentTypes[number];



const contentSchema: Schema = new Schema({
  link: { type: String},
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  data: { type: String },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});


const Content = mongoose.model("Content", contentSchema);

//Link Schema


const linkSchema: Schema = new mongoose.Schema({
  hash: { type: String, required: true },
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  contentId: { type: Types.ObjectId, ref: 'Content', required: true }

});

const myLink = mongoose.model("Link", linkSchema)

export { myLink, Content, Tag, User }