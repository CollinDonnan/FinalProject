/*
 * Filename: home.js
 * Authors: Jacob Karasow, Collin Donnan, John Hershey
 * Creation Date: 2025-10-21
 * Last Edit Date: 2025-12-08
 * Class: CMSC 421 Web Development
 * Description: JS file for home page
 *
 */

document.addEventListener("DOMContentLoaded", function () {
  if (window.productsLoaded) return;
  window.productsLoaded = true;

  /*************************
   *  Toast Notifications
   *************************/
  function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  }

  /*************************
   *  Category Normalization
   *************************/
  function canonicalCategory(cat) {
    if (!cat && cat !== "") return "";
    const s = String(cat).replace(/\./g, "").trim().toLowerCase();
    if (s.includes("misc")) return "misc";
    return s;
  }

  function sameCategory(a, b) {
    return canonicalCategory(a) === canonicalCategory(b);
  }

  /*************************
   *  Fetch Products
   *************************/
  fetch("./products_real_titles.json")
    .then((res) => res.json())
    .then((data) => {
      // add stock for checking if out
      const products = data.items.map((item, index) => ({
        id: index + 1,
        title: item.fields.title,
        category: item.fields.category,
        price: item.fields.price,
        image: `/images/product${index + 1}.jpg`,
        stock: item.fields.stock,
      }));

      const categories = [
        "Books",
        "Movies",
        "Electronics",
        "Video Games",
        "Toys",
        "Miscellaneous",
      ];

      let currentQuery = "";
      let currentCategory = null;

      /*************************
       *  Insert Category Select
       *************************/
      (function insertCategorySelectInNav() {
        try {
          const navRight = document.querySelector("#nav .nav-right");
          if (!navRight) return;

          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.alignItems = "center";
          wrapper.style.gap = "8px";
          wrapper.style.marginRight = "8px";

          const select = document.createElement("select");
          select.id = "categoryFilterSelect";

          const allOpt = document.createElement("option");
          allOpt.value = "";
          allOpt.textContent = "All Categories";
          select.appendChild(allOpt);

          categories.forEach((cat) => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
          });

          wrapper.appendChild(select);

          const searchBar = document.getElementById("searchBar");
          if (searchBar && searchBar.parentNode) {
            searchBar.parentNode.insertBefore(wrapper, searchBar);
          } else {
            navRight.insertBefore(wrapper, navRight.firstChild);
          }

          select.addEventListener("change", (e) => {
            const val = e.target.value;
            currentCategory = val === "" ? null : val;
            applyFiltersAndRender();
          });
        } catch (err) {
          console.error("Failed to insert category select:", err);
        }
      })();

      /*************************
       *  Wire Up Search Bar + Btn
       *************************/
      (function wireUpSearchControls() {
        const searchBar = document.getElementById("searchBar");
        const searchBtn = document.getElementById("searchBtn");

        if (searchBar) {
          searchBar.addEventListener("input", () => {
            currentQuery = searchBar.value.trim();
            applyFiltersAndRender();
          });

          searchBar.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              currentQuery = searchBar.value.trim();
              applyFiltersAndRender();
            }
          });
        }

        if (searchBtn) {
          searchBtn.addEventListener("click", () => {
            const bar = document.getElementById("searchBar");
            currentQuery = (bar && bar.value.trim()) || "";
            applyFiltersAndRender();
          });
        }
      })();

      /*************************
       *  Support redirect: index.html?search=xyz
       *************************/
      (function handleInitialRedirectSearch() {
        const params = new URLSearchParams(window.location.search);
        const incoming = params.get("search");
        if (!incoming) return;

        currentQuery = incoming.trim();
        if (currentQuery.length > 0) {
          const bar = document.getElementById("searchBar");
          if (bar) bar.value = currentQuery;
          setTimeout(() => applyFiltersAndRender(), 50);
        }
      })();

      /*************************
       *  Container Mapping
       *************************/
      function getContainerId(categoryLabel) {
        if (!categoryLabel) return "";
        if (sameCategory(categoryLabel, "Miscellaneous")) return "misc_display";
        return (
          categoryLabel.replace(/\./g, "").replace(/ /g, "_").toLowerCase() +
          "_display"
        );
      }

      /*************************
       *  Rendering Product Cards
       *************************/
      function renderProductCard(container, prod) {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML =
          `<img src="${prod.image}" alt="Image of ${escapeHtml(
            prod.title
          )}" loading="lazy" />` +
          `<h4><a href="products.html?id=${prod.id}">${escapeHtml(
            prod.title
          )}</a></h4>` +
          `<p><a href="products.html?id=${prod.id}">$${prod.price.toFixed(
            2
          )}</a></p>` +
          `<button class="addToCart">Add to Cart</button>`;

        container.appendChild(card);

        const img = card.querySelector("img");
        if (img) {
          img.addEventListener("load", (e) => e.target.classList.add("loaded"));
          img.addEventListener("error", (e) => {
            e.target.src = "/images/placeholder.jpg";
            e.target.classList.add("loaded");
          });
        }

        card.addEventListener("click", (evt) => {
          if (evt.target.classList.contains("addToCart")) return;
          window.location.href = "products.html?id=" + prod.id;
        });

        const atc = card.querySelector(".addToCart");
        if (atc) {
          // if out of stock dont allow to click add to cart
          if (prod.stock > 0) {
            atc.addEventListener("click", (event) => {
              event.stopPropagation();
              const cart = JSON.parse(localStorage.getItem("cart") || "[]");
              cart.push(prod.id);
              localStorage.setItem("cart", JSON.stringify(cart));
              showToast(`"${prod.title}" added to cart!`);
              if (typeof window.refreshCartCount === "function")
                window.refreshCartCount();
            });
          } else {
            atc.innerText = "Out of Stock";
            atc.style.backgroundColor = "red";
          }
        }
      }

      function escapeHtml(s) {
        return String(s).replace(
          /[&<>"']/g,
          (m) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            }[m])
        );
      }

      /*************************
       *  MAIN FILTER + RENDER
       *************************/
      function applyFiltersAndRender() {
        const q = currentQuery.toLowerCase();

        /* Unified search mode */
        if (currentCategory === null && q) {
          categories.forEach((cat) => {
            const id = getContainerId(cat);
            const section = document
              .getElementById(id)
              ?.closest(".category-section");
            if (section) section.style.display = "none";
          });

          let unified = document.getElementById("all_search_display");
          if (!unified) {
            unified = document.createElement("div");
            unified.id = "all_search_display";
            unified.className = "product-grid";
            unified.style.padding = "25px";
            const main = document.getElementById("categories");
            main.insertBefore(unified, main.firstChild);
          } else unified.innerHTML = "";

          const finalFiltered = products.filter((p) =>
            p.title.toLowerCase().includes(q)
          );

          if (finalFiltered.length === 0) {
            const note = document.createElement("div");
            note.style.padding = "12px";
            note.style.color = "#555";
            note.style.fontStyle = "italic";
            note.textContent = `No products matching "${currentQuery}".`;
            unified.appendChild(note);
          } else {
            finalFiltered.forEach((prod) => renderProductCard(unified, prod));
          }
          return;
        } else {
          const unified = document.getElementById("all_search_display");
          if (unified) unified.remove();
        }

        /* Category rendering */
        categories.forEach((category) => {
          const containerId = getContainerId(category);
          const container = document.getElementById(containerId);
          const section = container?.closest(".category-section");
          if (!container || !section) return;

          const isCategoryVisible =
            currentCategory === null
              ? true
              : sameCategory(currentCategory, category);

          section.style.display = isCategoryVisible ? "" : "none";

          const categoryProducts = products.filter((p) =>
            sameCategory(p.category, category)
          );

          const finalFiltered = categoryProducts.filter((p) =>
            q ? p.title.toLowerCase().includes(q) : true
          );

          container.innerHTML = "";

          const previewCount =
            currentCategory && sameCategory(currentCategory, category)
              ? finalFiltered.length
              : 4;

          finalFiltered
            .slice(0, previewCount)
            .forEach((prod) => renderProductCard(container, prod));

          const seeAllBtn = section.querySelector(".see-all");
          if (seeAllBtn) {
            seeAllBtn.style.display =
              (currentCategory && sameCategory(currentCategory, category)) || q
                ? "none"
                : "";
          }

          if (finalFiltered.length === 0) {
            const note = document.createElement("div");
            note.style.padding = "12px";
            note.style.color = "#555";
            note.style.fontStyle = "italic";
            note.textContent = q
              ? `No products matching "${currentQuery}" in ${category}.`
              : `No products in ${category}.`;
            container.appendChild(note);
          }
        });
      }

      window.applyFilters = applyFiltersAndRender;

      /*************************
       *  Initial render
       *************************/
      applyFiltersAndRender();

      /*************************
       *  Modal "See All"
       *************************/
      const modal = document.getElementById("modalOverlay");
      const modalTitle = document.getElementById("modalTitle");
      const modalProducts = document.getElementById("modalProducts");
      const closeModal = document.getElementById("closeModal");

      const lockBodyScroll = (lock) =>
        (document.body.style.overflow = lock ? "hidden" : "");

      document.querySelectorAll(".see-all").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          const categoryLabel = event.currentTarget.dataset.category;
          modalTitle.textContent = categoryLabel;
          modalProducts.innerHTML = "";

          const allProducts = products.filter((p) =>
            sameCategory(p.category, categoryLabel)
          );

          if (allProducts.length === 0) {
            const note = document.createElement("div");
            note.style.padding = "12px";
            note.style.color = "#555";
            note.style.fontStyle = "italic";
            note.textContent = `No products in ${categoryLabel}.`;
            modalProducts.appendChild(note);
          } else {
            allProducts.forEach((prod) => {
              const card = document.createElement("div");
              card.className = "product-card";

              card.innerHTML =
                `<img src="${prod.image}" alt="Image of ${escapeHtml(
                  prod.title
                )}" loading="lazy" />` +
                `<h4><a href="products.html?id=${prod.id}">${escapeHtml(
                  prod.title
                )}</a></h4>` +
                `<p><a href="products.html?id=${prod.id}">$${prod.price.toFixed(
                  2
                )}</a></p>` +
                `<button class="addToCart">Add to Cart</button>`;

              modalProducts.appendChild(card);

              const img = card.querySelector("img");
              if (img) {
                img.addEventListener("load", (e) =>
                  e.target.classList.add("loaded")
                );
                img.addEventListener("error", (e) => {
                  e.target.src = "/images/placeholder.jpg";
                  e.target.classList.add("loaded");
                });
              }

              card.addEventListener("click", (evt) => {
                if (evt.target.classList.contains("addToCart")) return;
                window.location.href = "products.html?id=" + prod.id;
              });

              const atc = card.querySelector(".addToCart");
              if (atc) {
                atc.addEventListener("click", (evt) => {
                  evt.stopPropagation();
                  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
                  cart.push(prod.id);
                  localStorage.setItem("cart", JSON.stringify(cart));
                  showToast(`"${prod.title}" added to cart!`);
                  if (typeof window.refreshCartCount === "function")
                    window.refreshCartCount();
                });
              }
            });
          }

          lockBodyScroll(true);
          modal.classList.add("active");
        });
      });

      closeModal.addEventListener("click", () => {
        modal.classList.remove("active");
        lockBodyScroll(false);
      });
      modal.addEventListener("click", (evt) => {
        if (evt.target === modal) {
          modal.classList.remove("active");
          lockBodyScroll(false);
        }
      });
    })

    .catch((err) => {
      console.error("Failed to load products:", err);
    });

  // ---------------- EXISTING CODE (UNCHANGED) ----------------

  // Load navbar
  document.addEventListener("DOMContentLoaded", () => {
    fetch("/html/navbar.html")
      .then((response) => response.text())
      .then((data) => {
        document.getElementById("navbar-container").innerHTML = data;
      });

    loadProducts();
  });
  /********************************************************
       ⭐ HOTTEST ITEMS — Select 3 random products + render
      ********************************************************/
  (function renderHottestItems() {
    const container = document.getElementById("hottestItems");
    if (!container) return;

    const randomProducts = [...products]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    randomProducts.forEach((prod) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML =
        `<img src="${prod.image}" alt="${prod.title}" />` +
        `<h4><a href="products.html?id=${prod.id}">${prod.title}</a></h4>` +
        `<p>$${prod.price.toFixed(2)}</p>` +
        `<button class="addToCart">Add to Cart</button>`;

      container.appendChild(card);

      card.querySelector(".addToCart").addEventListener("click", (e) => {
        e.stopPropagation();
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        cart.push(prod.id);
        localStorage.setItem("cart", JSON.stringify(cart));
        showToast(`"${prod.title}" added to cart!`);
      });

      card.addEventListener("click", () => {
        window.location.href = "products.html?id=" + prod.id;
      });
    });
  })();
});
