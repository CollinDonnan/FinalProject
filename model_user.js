/*
 * Author: John Hershey, Collin Donnan
 * Creation Date: 2025-11-11
 * Last Edit Date: 2025-12-05
 * Class: CMSC 421 Web Development
 * Description: code for mongodb login schema part of website, based on Dr X's example
 */
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
mongoose.connect(
  process.env.uri
);
const Schema = mongoose.Schema;

const User = new Schema({
  username: String,
  name: String,
  date: String,
});
User.plugin(passportLocalMongoose);

module.exports = mongoose.model("userinfos", User);

