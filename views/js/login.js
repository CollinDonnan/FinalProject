/*
 * Filename: login.js
 * Authors: John Hershey, Tanner Ness
 * Creation Date: 2025-10-21
 * Last Edit Date: 2025-12-05
 * Class: CMSC 421 Web Development
 * Description: contains code for login page
 */

const first_Name = document.getElementById("fname");
const last_Name = document.getElementById("lname");
const email = document.getElementById("e-mail");
const password = document.getElementById("pwrd");
const password_repeat = document.getElementById("rep-pwrd");
const login_email = document.getElementById("login-email"); // for login form
const login_password = document.getElementById("login-pwrd"); // for login form

let accountdata = document.getElementById("accountdata");
let signupform = document.getElementById("signupform");
let loginform = document.getElementById("loginform");
let logintext = document.getElementById("txt");
signupform.style.display = "none";
//when page is loaded and user is logged in will show user account
showAccount();

// Check if both passwords match
function isSamePasswords() {
  if (password.value !== password_repeat.value) {
    passwords_not_match();
    return false;
  }
  return true;
}

async function signup() {
  // if passwords are not the same
  if (!isSamePasswords()) return;

  // data to send to database
  const data = {
    username: email.value,
    fname: first_Name.value,
    lname: last_Name.value,
    email: email.value,
    pwrd: password.value,
    repwrd: password_repeat.value,
  };

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data),
      credentials: "include",
    });

    if (response.ok) {
      alert("Signup successful!");
      window.location.href = "/login.html";
    } else {
      alert("Signup failed. Please try again.");
    }
  } catch (error) {
    console.error(error);
    alert("Error during signup.");
  }
}

async function login() {
  // information to check with database
  const data = {
    username: login_email.value,
    password: login_password.value,
  };
  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data),
      credentials: "include",
    });
    // credentials are wrong
    if (!response.ok) {
      invalid_login_popup();
    }
    // if error occurs
  } catch (error) {
    console.error(error);
    invalid_login_popup();
  }
}

// Toggle between signup and login forms
function signUpSwitch() {
  accountdata.style.display = "none";
  if (signupform.style.display === "none") {
    signupform.style.display = "block";
    loginform.style.display = "none";
    logintext.innerText = "Sign up to access our wonderful deals!";
  } else {
    signupform.style.display = "none";
    loginform.style.display = "block";
    logintext.innerText = "Log in to your account.";
  }
}

function invalid_login_popup() {
  alert("Invalid login credentials");
}

function passwords_not_match() {
  alert("Passwords do not match");
}
function showAccount() {
  const XMLreq = new XMLHttpRequest();
  XMLreq.open("GET", "http://localhost:5000/user", true);
  XMLreq.send();
  XMLreq.onreadystatechange = function () {
    if (XMLreq.readyState == 4 && XMLreq.status == 200) {
      try {
        const user = JSON.parse(XMLreq.response).user;
        console.log("logged in");
        accountdata.style.display = "inline-block";
        signupform.style.display = "none"; //blank out the other forms
        loginform.style.display = "none";
        logintext.innerText = "Your Account:";
        // set account data elements
        let accountemail = document.getElementById("account-email");
        accountemail.innerText = `Email: \n ${user.username}`;
        let accountname = document.getElementById("account-name");
        accountname.innerText = `Name: \n${user.name}`;
        let accountdate = document.getElementById("account-date");
        accountdate.innerText = `Date Joined: \n${user.date.slice(
          0,
          user.date.indexOf("G")
        )}`;
      } catch {
        return;
      }
    }
  };
}
