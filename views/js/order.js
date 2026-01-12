// Tanner Ness
// functions exclusive to order.html
// revisions then

/*
 * Filename: order.js
 * Authors: Tanner Ness, Jacob Karasow
 * Creation Date: 2025-10-21
 * Last Edit Date: 2025-12-05
 * Class: CMSC 421 Web Development
 * Description: JS file for order/cart page
 *
 */

const order_list_div = document.getElementById("order-list");
const total_span = document.getElementById("total");
const total_value_div = document.getElementById("total-value");
const summary_h1 = document.getElementById("summary");
const confirm_order_button = document.getElementById("confirm");
const clear_cart = document.getElementById("clear-cart");

var isHidden = false;
var empty_cart = true;
var order_confirmed = false;
var total = 0;

// one cart item contains [title, price, image, amount, stock]

// NEW: Load cart from localStorage
let storedCart = JSON.parse(localStorage.getItem("cart")) || [];

// NEW: cart_list now starts empty and is filled from product data
var cart_list = [];

// NEW: Fetch product data and convert stored cart IDs -> cart_list items
fetch("products_real_titles.json")
  .then((response) => response.json())
  .then((data) => {
    const productList = data.items;

    storedCart.forEach((id) => {
      const product = productList[id - 1]; // product IDs are 1-based
      if (product) {
        let title = product.fields.title;
        let price = product.fields.price;
        let stock = product.fields.stock;
        let imagePath = "images/product" + id + ".jpg";

        // Prevent adding out-of-stock items to the cart
        if (stock === 0) {
          console.warn(`${title} is out of stock and cannot be added to cart.`);
          return;
        }

        // If the item is already in cart_list, increment quantity
        let existing = cart_list.find((p) => p[0] === title);
        if (existing) {
          if (existing[3] >= existing[4]) {
            // do nothing since at maximum amount
          } else {
            existing[3] += 1;
          }
        } else {
          cart_list.push([title, price, imagePath, 1, stock]);
        }
      }
    });

    check_is_empty();
    displayProducts();
  })
  .catch(() => {
    console.log("Error loading product data.");
    check_is_empty();
  });

// only if the cart is empty, clear cart, total, and confirm button are hidden
function check_is_empty() {
  if (cart_list.length == 0) {
    total_value_div.hidden = true;
    confirm_order_button.hidden = true;
    clear_cart.hidden = true;
    summary_h1.style.display = "none";
    isHidden = true;
    empty_cart_text();
    return isHidden;
  } else {
    total_value_div.hidden = false;
    confirm_order_button.hidden = false;
    clear_cart.hidden = false;
    summary_h1.style.display = "block";
    isHidden = false;
    empty_cart_text();
    return isHidden;
  }
}

function empty_cart_text() {
  const alt = document.getElementById("empty-cart");
  if (isHidden && !order_confirmed) {
    alt.hidden = false;
  } else {
    alt.hidden = true;
  }
}

function displayProducts() {
  for (product in cart_list) {
    createProduct(cart_list[product]);
  }
  getTotalCartCost();
}

function createProduct(a_product) {
  const item = document.createElement("div");
  item.className = "item";
  item.id = "item-" + a_product[0];

  // NEW: Gray-out product if out of stock
  if (a_product[4] === 0) {
    item.style.opacity = "0.5";
    item.style.pointerEvents = "none";
  }

  const product = document.createElement("div");
  product.className = "product";
  const img = document.createElement("img");
  img.src = a_product[2];
  img.alt = a_product[0];
  img.width = 150;
  img.height = 200;
  product.appendChild(img);

  const product_info = document.createElement("div");
  product_info.className = "product-info";

  const h3 = document.createElement("h3");
  h3.textContent = a_product[0];

  const h4 = document.createElement("h4");
  h4.textContent = "Price:  $";
  const price_span = document.createElement("span");
  price_span.id = "price";
  price_span.textContent = a_product[1];

  const p = document.createElement("p");
  p.id = "remove";
  p.textContent = "remove";
  p.addEventListener("click", () => remove_from_cart(a_product));

  product_info.appendChild(h3);
  h4.appendChild(price_span);
  product_info.appendChild(h4);
  product_info.appendChild(p);
  product.appendChild(product_info);
  item.appendChild(product);

  const increase_decrease_amount = document.createElement("div");
  increase_decrease_amount.className = "increase-decrease-amount";

  const increase = document.createElement("div");
  increase.id = "increment";
  const i_up = document.createElement("i");
  i_up.className = "fa-solid fa-square-caret-up";
  i_up.addEventListener("click", () => increment(a_product));

  // Disable increment button if qty == stock
  if (a_product[3] >= a_product[4]) {
    i_up.style.pointerEvents = "none";
    i_up.style.opacity = "0.3";
  }

  var quantity_span = document.createElement("span");
  quantity_span.id = "quantity-" + a_product[0];
  quantity_span.textContent = a_product[3];

  const decrease = document.createElement("div");
  decrease.id = "decrement";
  const i_down = document.createElement("i");
  i_down.className = "fa-solid fa-square-caret-down";
  i_down.addEventListener("click", () => decrement(a_product));

  increase.appendChild(i_up);
  increase_decrease_amount.append(increase);
  increase_decrease_amount.appendChild(quantity_span);
  decrease.appendChild(i_down);
  increase_decrease_amount.append(decrease);
  item.append(increase_decrease_amount);

  order_list_div.appendChild(item);
}

function getTotalCartCost() {
  let acc = 0;
  for (product in cart_list) {
    acc += cart_list[product][1] * cart_list[product][3];
  }
  total = acc;
  total_span.innerHTML = total.toFixed(2);
}

function increment(product) {
  let name = document.getElementById("quantity-" + product[0]);

  if (product[3] < product[4]) {
    ++product[3];
  }

  updateLocalStorage();

  name.innerHTML = product[3];
  getTotalCartCost();

  // Disable increment if maxed out
  let incBtn = document.querySelector(`#item-${product[0]} #increment i`);
  if (product[3] >= product[4]) {
    incBtn.style.pointerEvents = "none";
    incBtn.style.opacity = "0.3";
  }
}

function decrement(product) {
  let name = document.getElementById("quantity-" + product[0]);

  --product[3];

  if (product[3] == 0) {
    remove_from_cart(product);
  }

  updateLocalStorage();

  name.innerHTML = product[3];
  getTotalCartCost();

  // Re-enable increment when qty falls below stock
  let incBtn = document.querySelector(`#item-${product[0]} #increment i`);
  incBtn.style.pointerEvents = "auto";
  incBtn.style.opacity = "1";
}

function remove_from_cart(product) {
  let name = document.getElementById("item-" + product[0]);
  name.remove();

  let index = cart_list.indexOf(product);
  cart_list.splice(index, 1);

  check_is_empty();
  getTotalCartCost();
}

function clear_cart_order() {
  while (cart_list.length != 0) {
    remove_from_cart(cart_list[product]);
  }
  total = 0;
  total_span.innerHTML = total;

  localStorage.removeItem("cart");
}

function updateLocalStorage() {
  const ids = [];
  cart_list.forEach((product) => {
    const productId = parseInt(product[2].match(/\d+/)[0]);
    for (let i = 0; i < product[3]; i++) {
      ids.push(productId);
    }
  });
  localStorage.setItem("cart", JSON.stringify(ids));
}

async function confirm_order() {
  try {
    const userCheck = await fetch("/user", { credentials: "include" });
    if (!userCheck.ok) {
      window.location.href = "/login.html";
      return;
    }

    if (!cart_list || cart_list.length === 0) {
      return;
    }

    const cart_data = cart_list.map((product) => {
      const prodID = parseInt(product[2].match(/\d+/)[0]);
      return {
        product_id: prodID,
        quantity: product[3],
        price: product[1],
      };
    });

    const response = await fetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: cart_data }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      console.log("Order sent!");
      order_confirmed = true;
      confirmation_popup();
      clear_cart_order();
    } else {
      alert("Failed to confirm order. Please try again.");
    }
  } catch (error) {
    console.error("Error confirming order:", error);
    window.location.href = "/login.html";
  }
}

function confirmation_popup() {
  const order_confirmed_div = document.getElementById("order-confirmed");
  if (order_confirmed) {
    order_confirmed_div.hidden = false;
  } else {
    order_confirmed_div.hidden = true;
  }
}

clear_cart.addEventListener("click", () => clear_cart_order());
confirm_order_button.addEventListener("click", () => confirm_order());
