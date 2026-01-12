/*
 * Filename: authController.js
 * Description: Controller for authentication and user management
 */

const User = require("../models/user");

// Render login page
exports.getLoginPage = (req, res) => {
  res.render("login.ejs", { message: "" });
};

// Handle user logout
exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

// Handle user registration
exports.register = (req, res, next) => {
  // Check that passwords match
  let passmiss = "passwords do not match";
  if (req.body.pwrd != req.body.repwrd) {
    console.log("error while user register!", passmiss);
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
      res.redirect("/");
    }
  );
};

// Handle user login
exports.login = (req, res, next) => {
  const passport = req.app.get('passport');
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
};

// Redirect logged-in user to home page
exports.getHomePage = (req, res) => {
  res.sendFile(req.app.get('appPath') + "/views/index.html");
};

// Get user data
exports.getUser = (req, res) => {
  res.send({ user: req.user });
};
