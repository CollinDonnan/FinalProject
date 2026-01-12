/*
 * Filename: orderController.js
 * Description: Controller for order management
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Order = require("../models/order");
const Product = require("../models/product");

// Create a new order
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Changes cart data to fit order schema
    const items = (req.body.cart ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      price_cents: Math.round(Number(item.price) * 100),
    }));

    // Save the order
    const order = new Order({
      user_id: req.user._id.toString(),
      items,
      timestamp: new Date(),
    });
    await order.save({ session });

    // Bulk operation to check stock and decrement amounts
    const bulkOps = items.map((it) => ({
      updateOne: {
        filter: {
          "sys.id": String(it.product_id),
          "fields.stock": { $gte: it.quantity },
        },
        update: {
          $inc: { "fields.stock": -it.quantity },
        },
      },
    }));

    const bulkResult = await Product.bulkWrite(bulkOps, { session });

    // Check if stocks were decremented
    const matched = bulkResult.result?.nMatched ?? bulkResult.matchedCount ?? 0;
    const modified =
      bulkResult.result?.nModified ?? bulkResult.modifiedCount ?? 0;

    if (matched !== items.length || modified !== items.length) {
      // Not enough stock - rollback
      await session.abortTransaction();
      return res.status(409).json({
        message: "Insufficient stock for one or more items.",
        details: { matched, modified, expected: items.length },
      });
    }

    // Commit transaction to database
    await session.commitTransaction();

    // Update local JSON file
    updateProductStock(items, req.app.get('appPath'));

    res.status(201).json({ message: "Order saved and stock updated." });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    res.status(500).json({ message: "Failed to save order or update stock." });
  } finally {
    session.endSession();
  }
};

// Helper function to update product stock in JSON file
async function updateProductStock(cartItems, appPath) {
  try {
    const productsFilePath = path.join(appPath, "products_real_titles.json");

    // Load file
    const raw = fs.readFileSync(productsFilePath, "utf8");
    const data = JSON.parse(raw);

    // Loop through cart items
    cartItems.forEach((item) => {
      // Find matching product in the JSON
      const product = data.items.find(
        (p) => String(p.sys.id) === String(item.product_id)
      );

      // Update stock if valid
      if (product && product.fields.stock >= item.quantity) {
        product.fields.stock -= item.quantity;
      }
    });

    // Save the file
    fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2));
    console.log("JSON stock updated.");
  } catch (err) {
    console.error("Error updating JSON stock:", err);
  }
}
