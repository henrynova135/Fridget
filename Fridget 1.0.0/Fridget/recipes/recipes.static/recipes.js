
// ========================================
// RECIPE ELEMENT SELECTORS
// ========================================

const searchBtn = document.querySelector(".recipe-search-button");
const searchInput = document.querySelector(".recipe-search-input");
const searchResults = document.querySelector(".recipe-search-results");

const recipeModal = document.querySelector(".recipe-detail-modal");
const closeBtn = document.querySelector(".recipe-close-button");

const detailImage = document.querySelector(".recipe-detail-image");
const detailTitle = document.querySelector(".recipe-detail-title");
const detailTime = document.querySelector(".recipe-detail-time");
const detailIngredients = document.querySelector(".recipe-detail-ingredients");
const detailInstructions = document.querySelector(".recipe-detail-instructions");
const detailTips = document.querySelector(".recipe-detail-tips");
const detailVideo = document.querySelector(".recipe-detail-video");


// Search cards by title and visible recipe details.
function searchRecipe() {
    if (!searchInput || !searchResults) return;
    const query = searchInput.value.trim().toLowerCase();
    const cards = [...document.querySelectorAll(".recipe-card")];
    searchResults.innerHTML = "";
    let count = 0;
    cards.forEach(card => {
        const matches = !query || card.textContent.toLowerCase().includes(query);
        card.hidden = !matches;
        if (matches && query) {
            count++;
            const title = card.querySelector("h3")?.textContent.trim() || "Recipe";
            const result = document.createElement("button");
            result.type = "button";
            result.className = "searchRecipeButton";
            result.textContent = title;
            result.addEventListener("click", () => {
                card.scrollIntoView({behavior:"smooth",block:"center"});
                card.classList.add("search-highlight");
                setTimeout(() => card.classList.remove("search-highlight"), 1400);
                searchResults.style.display = "none";
            });
            searchResults.appendChild(result);
        }
    });
    if (query) {
        if (!count) searchResults.textContent = "No recipes found.";
        searchResults.style.display = "block";
    } else searchResults.style.display = "none";
}
if (searchInput) searchInput.addEventListener("input", searchRecipe);
if (searchBtn) searchBtn.addEventListener("click", searchRecipe);
if (searchInput) searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); searchRecipe(); }
});
if (searchResults && searchInput && searchBtn) document.addEventListener("click", event => {
    if (!searchResults.contains(event.target) && !searchInput.contains(event.target) && !searchBtn.contains(event.target)) searchResults.style.display = "none";
});

// Guest-friendly wishlist, stored in this browser.
(function setupWishlist() {
    const key = "fridget-wishlist";
    const read = () => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { return []; } };
    const write = items => localStorage.setItem(key, JSON.stringify(items));
    document.querySelectorAll(".recipe-card").forEach(card => {
        const title = card.querySelector("h3")?.textContent.trim();
        if (!title || card.querySelector(".wishlist-toggle")) return;
        const image = card.querySelector("img")?.getAttribute("src") || "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wishlist-toggle";
        button.style.cssText = "margin:8px 0;padding:8px 12px;border:0;border-radius:18px;cursor:pointer;";
        const isSaved = () => read().some(item => String(item.name).toLowerCase() === title.toLowerCase());
        const paint = () => { button.textContent = isSaved() ? "♥ Saved" : "♡ Save to wishlist"; button.setAttribute("aria-pressed", String(isSaved())); };
        button.addEventListener("click", () => {
            let items = read();
            items = isSaved() ? items.filter(item => String(item.name).toLowerCase() !== title.toLowerCase()) : [...items, {name:title,image}];
            write(items); paint();
        });
        const view = card.querySelector(".recipe-card-button");
        if (view) view.insertAdjacentElement("afterend", button); else card.append(button);
        paint();
    });
})();

// Category navigation scrolls to the requested section without hiding the rest.
(function applyRecipeQuery() {
    const params = new URLSearchParams(window.location.search);
    const category = (params.get("category") || "").toLowerCase();
    const search = (params.get("search") || "").trim();
    const sections = {
        breakfast: ".breakfast-container",
        lunch: ".lunch-container",
        dinner: ".dinner-container",
        dessert: ".dessert-container",
        desserts: ".dessert-container"
    };
    if (category && sections[category]) {
        window.addEventListener("load", () => {
            const container = document.querySelector(sections[category]);
            const heading = container && container.previousElementSibling;
            (heading || container)?.scrollIntoView({ behavior: "smooth", block: "start" });
            if (container) {
                container.classList.add("category-arrival-highlight");
                window.setTimeout(() => container.classList.remove("category-arrival-highlight"), 1500);
            }
        }, { once: true });
    }
    if (search && searchInput) {
        searchInput.value = search;
        searchRecipe();
    }
})();

// ========================================
// 20 RECIPES DATA
// ========================================

const Recipes = [
    {
        name: "fried rice",
        imgSrc: "https://twokooksinthekitchen.com/wp-content/uploads/2022/07/Chinese-egg-fried-rice.jpg",
        imgAlt: "Chinese egg Fried Rice",
        time: "20 minutes | Easy",
        ingredients: [
            "3 cups cooked rice",
            "2 eggs",
            "1 small carrot, diced",
            "2 spring onions, chopped",
            "2 tablespoons soy sauce",
            "1 tablespoon cooking oil",
            "Salt and pepper to taste"
        ],
        instructions: [
            "Heat the oil in a pan.",
            "Scramble the eggs, then set them aside.",
            "Add the carrot and cook until slightly tender.",
            "Add the cooked rice and stir-fry.",
            "Add soy sauce, salt, and pepper.",
            "Mix in the eggs and spring onions. Serve hot."
        ],
        tips: "Day old rice",
        videoHref: "https://www.youtube.com/watch?v=pc1ZzHhPs7Y"
    },
    {
        name: "Fluffy Pumpkin Pancakes",
        imgSrc: "https://assets.epicurious.com/photos/6364cca319db404ebecc095a/1:1/w_1920,c_limit/Pumpkin-Pancakes.jpg",
        imgAlt: "Fluffy Pumpkin Pancakes",
        time: "20 minutes | Easy",
        ingredients: [
            "1 cup flour",
            "½ cup pumpkin purée",
            "1 egg",
            "¾ cup milk",
            "1 tbsp sugar",
            "1 tsp baking powder",
            "Cinnamon, butter"
        ],
        instructions: [
            "Mix the ingredients into a batter.",
            "Pour small portions into a buttered pan and cook both sides until golden."
        ],
        tips: "Cook the eggs over low heat for a softer texture.",
        videoHref: "https://www.youtube.com/watch?v=axuuaXZXpi0"
    },
    {
        name: "Eggs and Toast",
        imgSrc: "https://assets.epicurious.com/photos/55ad19f02165ea17798702d0/1:1/w_1920,c_limit/EP_15072015_TOMATOTOAST_019.jpg",
        imgAlt: "Eggs and Toast",
        time: "10 minutes | Easy",
        ingredients: [
            "2 eggs",
            "2 slices of bread",
            "1 tsp butter or oil",
            "Salt and pepper"
        ],
        instructions: [
            "Toast the bread.",
            "Beat the eggs with seasoning.",
            "Then scramble in a lightly greased pan until fully cooked."
        ],
        tips: "Cook the eggs over low heat for a softer texture.",
        videoHref: "https://www.youtube.com/watch?v=X4N2mL-d4eM"
    },
    {
        name: "fruits yogurt bowl",
        imgSrc: "https://assets.epicurious.com/photos/552c1d0720ca5d650ed23b4b/1:1/w_768,c_limit/56389458_avocado-yogurt-soup_6x4.jpg",
        imgAlt: "Fruits yogurt Bowl",
        time: "5 minutes | Very easy",
        ingredients: [
            "1 cup plain yogurt",
            "½ banana",
            "3 strawberries",
            "A handful of grapes",
            "2 tbsp granola or oats",
            "Honey (optional)"
        ],
        instructions: [
            "Add yogurt to a bowl.",
            "Slice the fruits, arrange them on top, and finish with granola and honey."
        ],
        tips: "Use chilled fruit and add granola just before serving to keep it crunchy.",
        videoHref: "https://www.youtube.com/watch?v=2nWi37RKzmw"
    },
    {
        name: "Creamy garlic Pasta",
        imgSrc: "https://assets.epicurious.com/photos/5d780d0823467f00090b88ad/1:1/w_1920,c_limit/Creamy-Pasta-Crispy-Mushroom-recipe-BA-091019.jpg",
        imgAlt: "Creamy garlic Pasta",
        time: "25 minutes | Easy",
        ingredients: [
            "200 g pasta",
            "3 garlic cloves, minced",
            "½ cup cream",
            "2 tbsp grated cheese",
            "1 tbsp butter",
            "Salt, pepper, parsley"
        ],
        instructions: [
            "Boil the pasta.",
            "Sauté garlic in butter, add cream and cheese.",
            "Then mix in the cooked pasta with a little pasta water."
        ],
        tips: "Avoid browning the garlic too much, as it can taste bitter.",
        videoHref: "https://www.youtube.com/watch?v=euK_DYmsSTI"
    },
    {
        name: "Grilled Chicken with Lemon",
        imgSrc: "https://assets.epicurious.com/photos/5d1121c4ed11c17924c217b8/1:1/w_1920,c_limit/grilled-chicken-with-lemon-and-thyme-recipe-BA-060619.jpg",
        imgAlt: "grilled chicken with lemon",
        time: "30 minutes | Medium",
        ingredients: [
            "2 chicken breasts",
            "1 lemon",
            "2 garlic cloves",
            "1 tbsp olive oil",
            "Salt",
            "pepper",
            "mixed herbs"
        ],
        instructions: [
            "Coat chicken with lemon juice, garlic, oil, and seasoning.",
            "Grill or pan-grill until cooked through."
        ],
        tips: "Let the chicken rest for 5 minutes before slicing. Ensure the thickest part reaches 74°C (165°F).",
        videoHref: "https://www.youtube.com/watch?v=5d9zRCpHLNg"
    },
    {
        name: "Chicken Sandwich",
        imgSrc: "https://assets.epicurious.com/photos/63e4ba1b55007bc33c26b9c1/1:1/w_1920,c_limit/ba-grilled-chicken-sando.jpg",
        imgAlt: "chicken sandwich",
        time: "15 minutes with cooked chicken | Easy",
        ingredients: [
            "2 slices of bread",
            "100 g cooked chicken",
            "1 lettuce leaf",
            "2 tomato slices",
            "1 tbsp mayonnaise",
            "Salt and pepper"
        ],
        instructions: [
            "Shred or slice the cooked chicken and mix with mayonnaise and seasoning.",
            "Layer it with lettuce and tomato between the bread slices."
        ],
        tips: "Toast the bread lightly to prevent it from becoming soggy.",
        videoHref: "https://www.youtube.com/watch?v=NqJtUVhAdNw"
    },
    {
        name: "Chicken Congee",
        imgSrc: "https://assets.epicurious.com/photos/6172bc98b0562e91c3d7d3a2/1:1/w_1920,c_limit/BonesInCongee_RECIPE_102121_22909.jpg",
        imgAlt: "Chicken Congee",
        time: "60 minutes | Easy",
        ingredients: [
            "Rice",
            "chicken",
            "ginger",
            "water or chicken stock",
            "spring onions"
        ],
        instructions: [
            "Rinse rice.",
            "Simmer with stock and ginger until soft and creamy.",
            "Add chicken and cook thoroughly. Season and garnish."
        ],
        tips: "Stir occasionally and add hot water if it becomes too thick.",
        videoHref: "https://www.youtube.com/watch?v=9wdmNZjYX9U"
    },
    {
        name: "Sweet and Sour Chicken",
        imgSrc: "https://assets.epicurious.com/photos/5995cb92b704ba5be91609a7/16:9/w_1920,c_limit/_22-Minute-Sweet-and-Sour-Chicken-hero-14082017.jpg",
        imgAlt: "Sweet and Sour Chicken",
        time: "35-45 minutes | Medium",
        ingredients: [
            "Chicken breast",
            "cornflour",
            "bell pepper",
            "pineapple (optional)",
            "ketchup",
            "vinegar",
            "sugar",
            "soy sauce"
        ],
        instructions: [
            "Coat and fry chicken until cooked.",
            "Stir-fry vegetables.",
            "Add the sauce.",
            "Then toss in the chicken."
        ],
        tips: "Add the fried chicken at the end to preserve its crispiness.",
        videoHref: "https://www.youtube.com/watch?v=KL6t2eMrT5A"
    },
    {
        name: "Miso Soup",
        imgSrc: "https://assets.epicurious.com/photos/640af1e0d4ec5fd7f485c23a/1:1/w_1920,c_limit/classic-miso-soup.jpg",
        imgAlt: "Miso Soup",
        time: "15 minutes | Easy",
        ingredients: [
            "Miso paste",
            "dashi stock",
            "tofu",
            "wakame seaweed",
            "spring onions"
        ],
        instructions: [
            "Heat the stock.",
            "Add tofu and soaked seaweed.",
            "Then dissolve miso paste into the soup."
        ],
        tips: "Avoid boiling vigorously after adding miso to preserve its delicate flavour.",
        videoHref: "https://www.youtube.com/watch?v=wshf6yZbhwk"
    },
    {
        name: "Roasted Chicken Dinner",
        imgSrc: "https://assets.epicurious.com/photos/679a4278c48dd37b72dbce47/1:1/w_1920,c_limit/0325-BIG-BATCH-ENTERTAINING-FINAL-1627.jpg",
        imgAlt: "Roasted Chicken Dinner",
        time: "75-100 minutes | Medium",
        ingredients: [
            "Whole chicken or chicken pieces",
            "potatoes",
            "carrots",
            "garlic",
            "butter or oil",
            "rosemary, salt",
            "pepper"
        ],
        instructions: [
            "Season chicken and vegetables.",
            "Roast at 200°C until golden and cooked through; rest before serving."
        ],
        tips: "Check the thickest part reaches 74°C for safe cooking.",
        videoHref: "https://www.youtube.com/watch?v=mH8uaWnr4FA"
    },
    {
        name: "Spaghetti Bolognese",
        imgSrc: "https://assets.epicurious.com/photos/63f4d1acf35c679dff83d5c9/1:1/w_1920,c_limit/HLY_Bolog_Horizontal.jpg",
        imgAlt: "Spaghetti Bolognese",
        time: "40-50 minutes | Easy-Medium",
        ingredients: [
            "Spaghetti",
            "minced beef",
            "onion",
            "garlic",
            "canned tomatoes",
            "tomato paste",
            "Italian herbs"
        ],
        instructions: [
            "Sauté onion and garlic",
            "brown the beef",
            "add tomatoes and herbs",
            "Then simmer.",
            "Boil spaghetti and serve with sauce"
        ],
        tips: "Simmer the sauce longer for a richer flavour.",
        videoHref: "https://www.youtube.com/watch?v=v2WqcHH65NQ"
    },
    {
        name: "Burmese Chicken Curry",
        imgSrc: "https://tse4.mm.bing.net/th/id/OIP.n3PzTE65Xxlw3tHpTsYdMQHaHa?r=0&w=735&h=736&rs=1&pid=ImgDetMain&o=7&rm=3",
        imgAlt: "Burmese Chicken Curry",
        time: "45-60 minutes | Medium",
        ingredients: [
            "Chicken",
            "onions",
            "garlic",
            "ginger",
            "tomatoes",
            "turmeric",
            "chilli powder",
            "oil",
            "fish sauce or salt"
        ],
        instructions: [
            "Cook chopped onions until soft, add garlic, ginger and spices, then chicken and tomatoes.",
            "Add a little water and simmer until tender."
        ],
        tips: "Cook the onion-spice mixture well before adding the chicken for deeper flavour.",
        videoHref: "https://www.youtube.com/watch?v=mVuYYJ6Nc20"
    },
    {
        name: "Beef Steak",
        imgSrc: "https://assets.epicurious.com/photos/56702e32864271d93196397f/1:1/w_1920,c_limit/hanger-2.jpg",
        imgAlt: "Beef Steak",
        time: "20-30 minutes | Medium",
        ingredients: [
            "Beef steak",
            "salt",
            "black pepper",
            "oil",
            "butter",
            "garlic",
            "rosemary (optional)"
        ],
        instructions: [
            "Pat steak dry and season.",
            "Sear in a hot pan, add butter and garlic, baste, then rest before slicing."
        ],
        tips: "Use a meat thermometer for reliable doneness and food safety.",
        videoHref: "https://www.youtube.com/watch?v=SQoaszSmk80"
    },
    {
        name: "Mac and Cheese",
        imgSrc: "https://assets.epicurious.com/photos/5a13316e26986b7d9f9b0070/1:1/w_1920,c_limit/Back-of-the-box-MACARONI-and-CHEESE-FOR-A-CROWD-15112017.jpg",
        imgAlt: "Mac and Cheese",
        time: "30-40 minutes | Easy-Medium",
        ingredients: [
            "Macaroni",
            "butter",
            "flour",
            "milk",
            "cheddar cheese",
            "salt",
            "pepper"
        ],
        instructions: [
            "Boil macaroni.",
            "Make a butter-flour roux, gradually whisk in milk, melt in cheese, and combine with pasta.",
            "Bake optionally."
        ],
        tips: "Add milk gradually to prevent lumps in the sauce.",
        videoHref: "https://www.youtube.com/watch?v=YxVZuuxxXxk"
    },
    {
        name: "coffee",
        imgSrc: "https://img.magnific.com/premium-photo/cup-coffee_1014817-82.jpg",
        imgAlt: "coffee",
        time: "5-10 minutes | Easy",
        ingredients: [
            "Coffee grounds or instant coffee",
            "hot water",
            "milk",
            "sugar (optional)"
        ],
        instructions: [
            "Brew or dissolve coffee in hot water.",
            "Add warm milk and sugar to taste."
        ],
        tips: "Use freshly brewed coffee and adjust the milk-to-coffee ratio to your preference.",
        videoHref: "https://www.youtube.com/watch?v=JeXsKCySpGI&t=17s"
    },
    {
        name: "Matcha Latte",
        imgSrc: "https://ts1.mm.bing.net/th?id=OIP.sUmwstpi-mCpgBfICpgzEAHaHa&pid=15.1",
        imgAlt: "Matcha Latte",
        time: "5-10 minutes | Easy",
        ingredients: [
            "Matcha powder",
            "hot water",
            "milk",
            "honey or sugar (optional)",
            "ice for an iced version"
        ],
        instructions: [
            "Sift matcha, whisk with a little hot water until smooth.",
            "Then add milk and sweetener.",
            "Add ice if desired."
        ],
        tips: "Use hot, not boiling, water to avoid a bitter taste.",
        videoHref: "https://www.youtube.com/watch?v=fAkPPyodzSM"
    },
    {
        name: "Brownies",
        imgSrc: "https://assets.epicurious.com/photos/5fca950999e408725afcb3e4/1:1/w_1920,c_limit/Brownies_3_VOG_final.jpg",
        imgAlt: "Brownies",
        time: "35-45 minutes | Easy-Medium",
        ingredients: [
            "Dark chocolate",
            "butter",
            "sugar",
            "eggs",
            "flour",
            "cocoa powder"
        ],
        instructions: [
            "Melt chocolate and butter.",
            "Mix in sugar and eggs, fold in flour and cocoa.",
            "Then bake at 175°C until set."
        ],
        tips: "Avoid overbaking for a fudgy centre; cool before cutting.",
        videoHref: "https://www.youtube.com/watch?v=8bi1MaUuzcQ"
    },
    {
        name: "cookies",
        imgSrc: "https://assets.epicurious.com/photos/6377cc9aa4553e333b2e0ddf/1:1/w_1920,c_limit/1115-epi-molasses-cookies-lede.jpg",
        imgAlt: "Cookies",
        time: "25-34 minutes | Easy",
        ingredients: [
            "Flour, butter",
            "brown and white sugar",
            "egg",
            "baking soda",
            "chocolate chips",
            "vanilla"
        ],
        instructions: [
            "Cream butter and sugar",
            "Mix in egg and vanilla",
            "Add dry ingredients and chocolate chips",
            "Then bake at 175°C until lightly golden"
        ],
        tips: "Chill the dough for 20–30 minutes to help prevent excessive spreading.",
        videoHref: "https://www.youtube.com/watch?v=PFJAuAWxuvI"
    },
    {
        name: "Pudding",
        imgSrc: "https://images.mrcook.app/recipe-image/01949e7b-ded4-77dd-94f3-bf3234bee5f1?cacheKey=U2F0LCAyNSBKYW4gMjAyNSAxNzoyMTo0NyBHTVQ=",
        imgAlt: "Pudding",
        time: "20 min + chilling | Easy",
        ingredients: [
            "Milk, sugar",
            "cornflour",
            "vanilla extract. Optional:",
            "egg yolks or caramel"
        ],
        instructions: [
            "Mix cornflour with a little cold milk.",
            "Heat remaining milk and sugar, whisk in the mixture, and cook until thick.",
            "Pour into cups and chill."
        ],
        tips: "Whisk continuously while heating to keep the pudding smooth.",
        videoHref: "https://www.youtube.com/watch?v=RyFmkGbwNpA"
    }
];

// Shared recipe data is also used by the Wishlist page.
window.FridgetRecipes = Recipes;



// ========================================
// DISPLAY RECIPE DETAILS
// ========================================

function openRecipe(i) {

    detailTitle.textContent = Recipes[i].name;

    detailImage.src = Recipes[i].imgSrc;
    detailImage.alt = Recipes[i].imgAlt;

    detailTime.textContent = Recipes[i].time;

    const ingredients = Recipes[i].ingredients;

    detailIngredients.innerHTML = "";

    for (let i = 0; i < ingredients.length; i++) {
        const item = document.createElement("li");

        item.textContent = ingredients[i];

        detailIngredients.appendChild(item);
    }

    const instructions = Recipes[i].instructions;

    detailInstructions.innerHTML = "";

    for (let i = 0; i < instructions.length; i++) {
        const step = document.createElement("li");

        step.textContent = instructions[i];

        detailInstructions.appendChild(step);
    }

    detailTips.textContent = Recipes[i].tips;

    const videoHref = String(Recipes[i].videoHref || "").trim();
    detailVideo.href = videoHref || "#";
    detailVideo.hidden = !videoHref;
    detailVideo.setAttribute("aria-hidden", String(!videoHref));

    if (recipeModal) {
        recipeModal.style.display = "flex";
        recipeModal.classList.remove("is-closing");
        recipeModal.classList.add("is-opening");
        recipeModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("recipe-modal-open");
    }
}


// ========================================
// HANDLE VIEW RECIPE BUTTONS
// ========================================

document.addEventListener("click", function (event) {

    const button = event.target.closest(".recipe-card-button");

    if (!button) {
        return;
    }

    const card = button.closest(".recipe-card");
    const title = card.querySelector("h3");

    if (title) {
        const name = title.textContent.trim().toLowerCase();

        for (let i = 0; i < Recipes.length; i++) {

            if (name === Recipes[i].name.trim().toLowerCase()) {
                openRecipe(i);
                break;
            }
        }
    }
});


// ========================================
// HANDLE SEARCH RESULT CLICKS
// ========================================

if (searchResults) searchResults.addEventListener("click", function (event) {

    if (!event.target.classList.contains("searchRecipeButton")) {
        return;
    }

    const name = event.target.textContent.trim().toLowerCase();

    for (let i = 0; i < Recipes.length; i++) {

        if (name === Recipes[i].name.trim().toLowerCase()) {
            openRecipe(i);
            searchResults.style.display = "none";
            break;
        }
    }
});


// ========================================
// CLOSE RECIPE MODAL
// ========================================

// Close using the X button

function closeRecipeModal() {
    if (!recipeModal || recipeModal.style.display === "none") return;
    recipeModal.classList.remove("is-opening");
    recipeModal.classList.add("is-closing");
    const finishClose = () => {
        recipeModal.style.display = "none";
        recipeModal.classList.remove("is-closing");
        recipeModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("recipe-modal-open");
    };
    const onCloseAnimationEnd = event => {
        if (event.target !== recipeModal) return;
        recipeModal.removeEventListener("animationend", onCloseAnimationEnd);
        finishClose();
    };
    recipeModal.addEventListener("animationend", onCloseAnimationEnd);
    window.setTimeout(() => {
        if (recipeModal.classList.contains("is-closing")) finishClose();
    }, 260);
}

if (closeBtn && recipeModal) closeBtn.addEventListener("click", closeRecipeModal);


// Close when clicking the dark background

if (recipeModal) recipeModal.addEventListener("click", function (event) {

    if (event.target === recipeModal) closeRecipeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && recipeModal && recipeModal.style.display === "flex") closeRecipeModal();
});


// Deep-link support for homepage Popular Recipes and direct recipe URLs.
(function openRecipeFromUrl() {
    const requested = (new URLSearchParams(window.location.search).get("recipe") || "").trim().toLowerCase();
    if (!requested) return;
    const normalize = value => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    const index = Recipes.findIndex(recipe => normalize(recipe.name) === normalize(requested));
    if (index >= 0) window.addEventListener("load", () => openRecipe(index), { once: true });
})();
