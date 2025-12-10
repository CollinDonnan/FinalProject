/*
 * Filename: model_order.js
 * Authors: Ian Swartz
 * Creation Date: 2025-11-11
 * Last Edit Date: 2025-11-25
 * Class: CMSC 421 Web Development
 * Description: code for mongodb order schema part of website, based on Dr X's example
 */

const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(
  process.env.uri
);

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },

  items: [
    {
      product_id: { type: Number, required: true },
      quantity: { type: Number, required: true },
      price_cents: { type: Number, required: true },
    },
  ],

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("orderinfos", OrderSchema);

// OLD CODE
// const mongoose = require("mongoose");

// const passportLocalMongoose = require("passport-local-mongoose");

// mongoose.connect(
//   "mongodb+srv://db_user_1:dIv4stk44rAE1CCs@cluster0.j2fdqzg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0 "
// );

// const Schema = mongoose.Schema;
// const Order = new Schema({
//   user_id: String,
//   cart: [{ product_id: Number, quantity: Number, price: Number }],
//   date: Date,
// });

// Order.plugin(passportLocalMongoose);

// module.exports = mongoose.model("orderinfos", Order);

