/*
 * Filename: products.js
 * Authors: Jacob Karasow, Ian Swartz, John Hershey
 * Creation Date: 2025-10-21
 * Last Edit Date: 2025-12-08
 * Class: CMSC 421 Web Development
 * Description: JS file for products page
 *
 */

document.addEventListener("DOMContentLoaded", function () {
  // -----------------------------------
  // GET PRODUCT ID FROM URL
  // -----------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id"), 10);

  // -----------------------------------
  // PAGE SECTIONS
  // -----------------------------------
  const noProductMessage = document.getElementById("noProductMessage");
  const productGrid = document.getElementById("productGrid");
  const recommendedSection = document.getElementById("recommendedSection");
  const recommendedGrid = document.getElementById("recommendedGrid");

  // -----------------------------------
  // FETCH PRODUCT LIST
  // -----------------------------------
  fetch("../products_real_titles.json")
    .then((response) => response.json())
    .then((data) => {
      const products = data.items.map((item, index) => ({
        id: index + 1,
        title: item.fields.title,
        price: item.fields.price,
        category: item.fields.category,
        description: item.fields.description || "",
        stock: item.fields.stock || 0,
        image: `../images/product${index + 1}.jpg`, // main product images
      }));

      // -----------------------------------
      // NO PRODUCT SELECTED
      // -----------------------------------
      if (!productId) {
        noProductMessage.classList.remove("hidden");
        productGrid.classList.add("hidden");

        renderRecommendedProducts(products, null);
        return;
      }

      // -----------------------------------
      // PRODUCT SELECTED
      // -----------------------------------
      const product = products[productId - 1];
      if (!product) {
        noProductMessage.innerHTML = "<h2>Product Not Found</h2>";
        noProductMessage.classList.remove("hidden");
        productGrid.classList.add("hidden");
        recommendedSection.classList.add("hidden");
        return;
      }

      // Hide no product message
      noProductMessage.classList.add("hidden");
      productGrid.classList.remove("hidden");

      // Fill product details
      document.getElementById(
        "productTitle"
      ).innerHTML = `<h2>${product.title}</h2>`;
      document.getElementById(
        "productPrice"
      ).textContent = `$${product.price.toFixed(2)}`;
      document.getElementById("productDescription").textContent =
        product.description;
      document.getElementById(
        "productStock"
      ).textContent = `In Stock: ${product.stock}`;
      document.getElementById(
        "productCategory"
      ).textContent = `Category: ${product.category}`;

      // -----------------------------------
      // MAIN PRODUCT IMAGE
      // -----------------------------------
      document.getElementById("productImage").innerHTML = `
        <img src="${product.image}" 
             alt="${product.title}" 
             onerror="this.src='../images/placeholder.jpg'">
      `;

      // -----------------------------------
      // ADD TO CART
      // -----------------------------------
      const addButton = document.getElementById("addToCart");
      if (product.stock > 0) {
        addButton.addEventListener("click", function () {
          let cart = JSON.parse(localStorage.getItem("cart") || "[]");
          cart.push(product.id);
          localStorage.setItem("cart", JSON.stringify(cart));
          showToast(`Added "${product.title}" to cart`);
        });
      } else {
        addButton.innerText = "Out of Stock";
        addButton.style.backgroundColor = "red";
      }

      // -----------------------------------
      // RECOMMENDED PRODUCTS — 2 ROWS OF 4, NO IMAGES
      // -----------------------------------
      renderRecommendedProducts(products, product);
    })
    .catch((err) => {
      console.error("Failed to load products:", err);
      noProductMessage.innerHTML = "<h2>Error Loading Products</h2>";
      noProductMessage.classList.remove("hidden");
      recommendedSection.classList.add("hidden");
    });

  // =========================================================
  // FUNCTION: RENDER RECOMMENDED PRODUCTS
  // =========================================================
  function renderRecommendedProducts(products, currentProduct) {
    recommendedSection.classList.remove("hidden");
    recommendedGrid.innerHTML = "";

    let suggestions = currentProduct
      ? products.filter((p) => p.id !== currentProduct.id)
      : products;

    // Shuffle and pick 8 products
    suggestions = [...suggestions].sort(() => Math.random() - 0.5).slice(0, 8);

    // Render each product (name + price only)
    suggestions.forEach((prod) => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <h4><a href="products.html?id=${prod.id}">${prod.title}</a></h4>
        <p>$${prod.price.toFixed(2)}</p>
      `;

      card.addEventListener("click", () => {
        window.location.href = "products.html?id=" + prod.id;
      });

      recommendedGrid.appendChild(card);
    });
  }

  // =========================================================
  // TOAST POPUP SYSTEM
  // =========================================================
  const toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  document.body.appendChild(toastContainer);

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("transitionend", () => toast.remove());
    }, 2000);
  }
});
