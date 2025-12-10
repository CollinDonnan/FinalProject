const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(
  process.env.uri
);

// Define schema matching the JSON structure
const Product = new mongoose.Schema({
  sys: {
    id: { type: String, required: true, unique: true },
  },
  fields: {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: {
      fields: {
        file: {
          url: { type: String, required: true },
        },
      },
    },
    description: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    rating: { type: Number, required: true },
    brand: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
  },
});

module.exports = mongoose.model("products", Product);

