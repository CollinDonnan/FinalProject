/*
 * Filename: app.js
 * Authors: Collin Donnan, John Hershey, Jacob Karasow
 * Creation Date: 2025-11-14
 * Last Edit Date: 2025-12-08
 * Class: CMSC 421 Web Development
 * Description: contains code for accessing and running website backend
 */

const express = require("express"); // Import the Express framework – used to build the web server
const bodyParser = require("body-parser"); // Middleware that helps parse data sent from forms (POST requests)
const session = require("express-session"); // Middleware for creating and managing user sessions (stores who’s logged in)
const passport = require("passport"); // Authentication library – handles login and verifying credentials
const connectEnsureLogin = require("connect-ensure-login"); // Middleware to protect pages so only logged-in users can access them
const Order = require("./models/order.js"); // Import the Order model from models folder
const User = require("./models/user.js"); // Import the User model from models folder
const Product = require("./models/product.js"); // Import the Product model from models folder
const app = express(); // Create an instance of an Express application
const port = 5000;
const fs = require("fs");
const path = require("path");

// connect to mongoose to create ordering sessions
const mongoose = require("mongoose");
// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://db_user_1:dIv4stk44rAE1CCs@cluster0.j2fdqzg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

app.use(
  session({
    secret: "grwgq3480430ufddj",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000, secure: false, sameSite: "lax" }, // 1 hour
  })
);

// ****************** FILE LOADING *******************************
// Serve static files from root directory and views directory
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'views')));

// Set up view engine for EJS templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ********************* MIDDLE WARE  **************************
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ************************* USER AUTH *******************************
app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

app.post("/register", function (req, res, next) {
  // check that passwords match
  //console.log(req.body); // for checking
  let passmiss = "passwords do not match";
  if (req.body.pwrd != req.body.repwrd) {
    console.log("error while user register!", passmiss);
    alert("passwords do not match!");
    return next(passmiss);
  }
  User.register(
    {
      username: req.body.email,
      name: `${req.body.fname} ${req.body.lname}`,
      date: Date(),
    },
    req.body.pwrd,
    function (err) {
      if (err) {
        console.log("error while user register!", err);
        return next(err);
      }
      console.log("user registered!");
      res.redirect("/"); // After successful registration, go back to login page
    }
  );
});

app.get("/login.html", (req, res) => {
  res.render("login.ejs", { message: "" });
});

// new
// sends user back to login page if not logged in
// otherwise send to order page
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("login.ejs", {
        message: "Invalid username or password.",
      });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/login.html");
    });
  })(req, res, next);
});

// new
// once logged in, send to home page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/user", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.send({ user: req.user })
);

// ************************* ORDERS TO DATABASE *******************************
// new
app.post("/orders", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // changes cart data to fit model_order.js schema
    const items = (req.body.cart ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      price_cents: Math.round(Number(item.price) * 100),
    }));

    // where the order is saved
    const order = new Order({
      user_id: req.user._id.toString(),
      items,
      timestamp: new Date(),
    });
    await order.save({ session });

    // for bulk operation
    // it checks stock and decrements the amount
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

    // checks if stocks were decremented
    const matched = bulkResult.result?.nMatched ?? bulkResult.matchedCount ?? 0;
    const modified =
      bulkResult.result?.nModified ?? bulkResult.modifiedCount ?? 0;

    if (matched !== items.length || modified !== items.length) {
      // if there is not enough stock, rollbacks the operation and tells the user
      // not enough stock
      await session.abortTransaction();
      return res.status(409).json({
        message: "Insufficient stock for one or more items.",
        details: { matched, modified, expected: items.length },
      });
    }

    // commits transaction to database
    await session.commitTransaction();

    updateProductStock(items);

    res.status(201).json({ message: "Order saved and stock updated." });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    res.status(500).json({ message: "Failed to save order or update stock." });
  } finally {
    session.endSession();
  }
});

async function updateProductStock(cartItems) {
  try {
    const productsFilePath = path.join(__dirname, "products_real_titles.json");

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

// Update stock in products_real_titles.json
/*
    req.body.cart.forEach((item) => {
      const product = productsData.items[item.product_id - 1];
      if (product && product.fields.stock >= item.quantity) {
        product.fields.stock -= item.quantity;
      }
      // end
    });

    fs.writeFileSync(productsFilePath, JSON.stringify(productsData, null, 2));

    res.status(201).json({ message: "Order saved to database." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save order to database." });
  }
});
*/

// *************************  RUN THE SERVER ***********************
app.listen(port, () => {
  //runs the app and prints the link
  console.log(`Server is running on http://localhost:${port}`);
});
