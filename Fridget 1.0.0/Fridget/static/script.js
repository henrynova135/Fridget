$(function() {
    const $body = $("body");
    // Apply the saved theme before the page becomes interactive.
    const savedTheme = localStorage.getItem("fridget-theme");
    if (savedTheme === "dark") {
        $body.removeClass("light-mode").addClass("dark-mode");
    } else if (savedTheme === "light") {
        $body.removeClass("dark-mode").addClass("light-mode");
    }
    const $toggle = $("#menuToggle");
    const $icon = $("#menuIcon");
    const $menu = $("#sideMenu");
    const $overlay = $(".menu-overlay");
    const $categoryWrapper  = $(".category-wrapper");
    const $categoryToggle  = $("#categoryToggle");
    const $settingsMenu  = $("#settingsMenu");
    const $settingsWrapper  = $(".settings-wrapper");
    const $settingsToggle  = $("#settingsToggle");
    const $categoryMenu  = $("#categoryMenu");
    const $searchToggle = $("#searchToggle");
    const $searchPanel = $("#searchPanel");
    const $recipeSearch = $("#recipeSearch");
    const $searchResults = $("#searchResults");
    const $chatBox = $('.chat-box');
    const $chatBody = $chatBox.find('.chat-body');
    const $input = $('#userInput');

    
let recipes = [];

function renderSearchResults() {
    const query = String($recipeSearch.val() || "")
        .trim()
        .toLowerCase();

    $searchResults.empty();
    $searchPanel.toggleClass("has-query", query.length > 0);

    if (!query) return;

    const matches = recipes.filter(function(recipe) {
        const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients.join(" ")
            : "";

        const searchableText = [
            recipe.name || "",
            recipe.category || "",
            ingredients
        ].join(" ").toLowerCase();

        return searchableText.includes(query);
    }).slice(0, 8);

    if (matches.length === 0) {
        $("<p>")
            .addClass("search-empty")
            .text("No recipes found.")
            .appendTo($searchResults);

        return;
    }

    matches.forEach(function(recipe) {
        const url = "/recipes?recipe=" + encodeURIComponent(recipe.name || "");

        const $link = $("<a>")
            .addClass("search-result")
            .attr("href", url);

        $("<span>")
            .addClass("search-result-name")
            .text(recipe.name || "Unnamed Recipe")
            .appendTo($link);

        $("<span>")
            .addClass("search-result-meta")
            .text(recipe.category || "Recipe")
            .appendTo($link);

        $searchResults.append($link);
    });
}

$.getJSON("/api/recipes")
    .done(function(data) {
        recipes = Array.isArray(data) ? data : [];
        renderSearchResults();

        console.log("Loaded recipes:", recipes.length);
    })
    .fail(function() {
        console.error("Could not load database.json");

        if ($searchPanel.hasClass("search-open")) {
            $searchPanel.addClass("has-query");
            $searchResults.empty();

            $("<p>")
                .addClass("search-empty")
                .text("Unable to load recipes. Please try again.")
                .appendTo($searchResults);
        }
    });

function openSearch() {
    $searchPanel.addClass("search-open");
    $searchToggle.attr("aria-expanded", "true");
    $recipeSearch.trigger("focus");
}

function closeSearch() {
    $searchPanel.removeClass("search-open has-query");
    $searchToggle.attr("aria-expanded", "false");
    $recipeSearch.val("");
    $searchResults.empty();
}

$recipeSearch.on("input", renderSearchResults);
$recipeSearch.on("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        const query = String($recipeSearch.val() || "").trim();
        if (query) {
            const exact = recipes.find(recipe => String(recipe.name || "").trim().toLowerCase() === query);
            const firstMatch = exact || recipes.find(recipe => String(recipe.name || "").toLowerCase().includes(query));
            if (firstMatch) window.location.href = "/recipes?recipe=" + encodeURIComponent(firstMatch.name);
            else window.location.href = "/recipes?search=" + encodeURIComponent(query);
        }
    }
});

$searchToggle.on("click", function(event) {
    event.stopPropagation();

    if ($searchPanel.hasClass("search-open")) {
        closeSearch();
    } else {
        openSearch();
    }
});

$("#closeSearch").on("click", closeSearch);

$(document).on("click", function(event) {
    if (!$(event.target).closest("#searchPanel, #searchToggle").length) {
        closeSearch();
    }
});

    $("#lightMode").on("click", function() {
            $("body").removeClass("dark-mode");
            $("body").addClass("light-mode");
            localStorage.setItem("fridget-theme", "light");
    });
    $("#darkMode").on("click", function() {
            $("body").removeClass("light-mode");
            $("body").addClass("dark-mode");
            localStorage.setItem("fridget-theme", "dark");
    });
    $categoryToggle.on("click", function(event) {
        event.preventDefault();
        const isOpen = $categoryWrapper.hasClass("category-open");
        $categoryWrapper.toggleClass("category-open", !isOpen);
        $categoryToggle.attr("aria-expanded", String(!isOpen));
    });
    $(document).on("click", function(event) {
        if (!$(event.target).closest(".category-wrapper").length) {
        $categoryWrapper.removeClass("category-open");
        $categoryToggle.attr("aria-expanded", "false");
        }
    });
    $settingsToggle.on("click", function(event) {
        event.preventDefault();
        const isOpen = $settingsWrapper.hasClass("settings-open");
        $settingsWrapper.toggleClass("settings-open", !isOpen);
        $settingsToggle.attr("aria-expanded", String(!isOpen));
    });
    $(document).on("click", function(event) {
        if (!$(event.target).closest(".settings-wrapper").length) {
        $settingsWrapper.removeClass("settings-open");
        $settingsToggle.attr("aria-expanded", "false");
        }
    });
    function openMenu() {
        $body.addClass("menu-open");
        $icon.removeClass("fa-bars").addClass("fa-xmark");
        $toggle.attr("aria-label", "Close menu");
        $toggle.attr("aria-expanded", "true");
        $menu.attr("aria-hidden", "false");
    }
    function closeMenu() {
        $body.removeClass("menu-open");
        $icon.removeClass("fa-xmark").addClass("fa-bars");
        $toggle.attr("aria-label", "Open menu");
        $toggle.attr("aria-expanded", "false");
        $menu.attr("aria-hidden", "true");
    }
    $toggle.on("click", function() {
        if ($body.hasClass("menu-open")) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    $overlay.on("click", closeMenu);
    $(document).on("keydown", function (event) {
        if(event.key === "Escape") {
        closeSearch();
        $categoryWrapper.removeClass("category-open");
        $categoryToggle.attr("aria-expanded", "false");
        $settingsWrapper.removeClass("settings-open");
        $settingsToggle.attr("aria-expanded", "false");
            closeMenu();
        }
    });
    $categoryMenu.find("a").on("click", function() {
       $categoryWrapper.removeClass("category-open");
        $categoryToggle.attr("aria-expanded", "false"); 
    })
    $settingsMenu.find("a").on("click", function() {
       $settingsWrapper.removeClass("settings-open");
        $settingsToggle.attr("aria-expanded", "false"); 
    })
    $menu.find("a").not("#categoryToggle").not("#settingsToggle").on("click", closeMenu);

    // Fridget account authentication
    const $authDialog = $("#authDialog");
    const $authBackdrop = $("#authBackdrop");
    const $authForm = $("#authForm");
    let authView = "login";
    let csrfToken = "";

    function authMessage(message, success) {
        $("#authMessage").text(message || "").toggleClass("success", !!success);
    }
    function openAuth() {
        $authDialog.prop("hidden", false);
        $authBackdrop.prop("hidden", false);
        $("#authIdentity").trigger("focus");
        refreshAccount();
    }
    function closeAuth() {
        $authDialog.prop("hidden", true);
        $authBackdrop.prop("hidden", true);
        authMessage("");
    }
    function setAuthView(view) {
        authView = view;
        const registering = view === "register";
        $("#authTitle").text(registering ? "Create your account" : "Welcome back");
        $("#authSubtitle").text(registering ? "Join Fridget and make your kitchen yours." : "Sign in to your account.");
        $("#nameField,#usernameField,#confirmField").prop("hidden", !registering);
        $("#authIdentity").attr("type", registering ? "email" : "text")
            .attr("autocomplete", registering ? "email" : "username")
            .attr("placeholder", registering ? "name@example.com" : "");
        $("#authPassword").attr("autocomplete", registering ? "new-password" : "current-password");
        $("#authTabs button").removeClass("active").filter(`[data-auth-view="${view}"]`).addClass("active");
        $("#authSubmit").text(registering ? "Create account" : "Log in");
        $("#emailVerifyForm,#passwordResetForm").prop("hidden", true);
        $("#forgotPasswordLink").prop("hidden", registering);
        $("#authForm,#authTabs").prop("hidden", false);
        authMessage("");
    }
    function refreshAccount() {
        $.ajax({url:"/api/me",method:"GET"}).done(function(data){
            csrfToken = data.csrf_token || csrfToken;
            if(data.authenticated){
                $authForm.prop("hidden",true); $("#authTabs").prop("hidden",true);
                $("#authTitle").text("Your account"); $("#authSubtitle").text("You are signed in to Fridget.");
                $("#authUser").prop("hidden",false); $("#authUserText").text("Signed in as " + data.user.display_name);
                $("#accountToggle").attr("aria-label","Account: " + data.user.display_name).html('<i class="fa-solid fa-user-check"></i>');
            } else {
                $authForm.prop("hidden",false); $("#authTabs").prop("hidden",false); $("#authUser").prop("hidden",true);
                $("#accountToggle").attr("aria-label","Account").html('<i class="fa-regular fa-user"></i>');
            }
        }).fail(function(){ authMessage("Could not connect to the server."); });
    }
    $("#authClose,#authBackdrop").on("click", closeAuth);
    $("#authUsername").on("input", function(){ const pos=this.selectionStart; this.value=this.value.toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,30); try{this.setSelectionRange(pos,pos);}catch(e){} });
    $("#accountToggle").on("click", function(event){
        event.preventDefault();
        $.getJSON("/api/me").done(function(data){ if(data.authenticated){ window.location.href="/account"; } else { openAuth(); } }).fail(openAuth);
    });
    $("#authTabs").on("click","button",function(){setAuthView($(this).data("auth-view"));});
    $("#authForm").on("submit",function(event){
        event.preventDefault(); authMessage("");
        const identity=$("#authIdentity").val().trim();
        const password=$("#authPassword").val();
        const payload={identity:identity,password:password,csrf_token:csrfToken};
        if(authView==="register"){
            payload.name=$("#authName").val().trim();
            payload.username=$("#authUsername").val().trim().toLowerCase();
            payload.confirm_password=$("#authConfirm").val();
            payload.email=identity;
        }
        const endpoint=authView==="register"?"/api/register":"/api/login";
        const $submit=$("#authSubmit").prop("disabled",true).text("Please wait...");
        $.ajax({url:endpoint,method:"POST",contentType:"application/json",data:JSON.stringify(payload)})
            .done(function(data){
                csrfToken=data.csrf_token||csrfToken;
                if(data.verification_required){
                    $("#authForm,#authTabs").prop("hidden",true);
                    $("#emailVerifyForm").prop("hidden",false);
                    $("#emailVerifyMessage").text(data.message||"Check your email for a verification code.");
                    $("#emailVerifyCode").trigger("focus");
                    return;
                }
                authMessage(data.message||"Success",true);
                $authForm[0].reset();closeAuth();refreshAccount();
            })
            .fail(function(xhr){const msg=xhr.responseJSON&&xhr.responseJSON.error?xhr.responseJSON.error:"Request failed. Please try again.";authMessage(msg);})
            .always(function(){$submit.prop("disabled",false).text(authView==="register"?"Create account":"Log in");});
    });
    $("#emailVerifyForm").on("submit",function(event){
        event.preventDefault();
        const $verifySubmit=$(this).find('button[type="submit"]').prop("disabled",true);
        $("#emailVerifyMessage").text("");
        $.ajax({
            url:"/api/verify-email",method:"POST",contentType:"application/json",
            data:JSON.stringify({code:$("#emailVerifyCode").val().trim(),csrf_token:csrfToken})
        }).done(function(data){
            csrfToken=data.csrf_token||csrfToken;
            $("#emailVerifyMessage").text(data.message||"Email verified.");
            closeAuth();refreshAccount();
        }).fail(function(xhr){
            const msg=xhr.responseJSON&&xhr.responseJSON.error?xhr.responseJSON.error:"Verification failed. Please try again.";
            $("#emailVerifyMessage").text(msg);
        }).always(function(){$verifySubmit.prop("disabled",false);});
    });
    $("#forgotPasswordLink").on("click",function(){
        const email = $("#authIdentity").val().trim();
        if(!email){ authMessage("Enter your account email address first."); $("#authIdentity").trigger("focus"); return; }
        authMessage("");
        $.ajax({url:"/api/forgot-password",method:"POST",contentType:"application/json",data:JSON.stringify({email:email,csrf_token:csrfToken})})
            .done(function(data){
                $("#authForm,#authTabs,#forgotPasswordLink").prop("hidden",true);
                $("#passwordResetForm").prop("hidden",false);
                $("#passwordResetMessage").text(data.message||"Check your email for a reset code.");
                $("#passwordResetCode").trigger("focus");
            })
            .fail(function(xhr){const msg=xhr.responseJSON&&xhr.responseJSON.error?xhr.responseJSON.error:"Could not request a password reset.";authMessage(msg);});
    });
    $("#passwordResetForm").on("submit",function(event){
        event.preventDefault();
        const $button=$(this).find('button[type="submit"]').prop("disabled",true);
        $("#passwordResetMessage").text("");
        $.ajax({url:"/api/reset-password",method:"POST",contentType:"application/json",data:JSON.stringify({
            code:$("#passwordResetCode").val().trim(),password:$("#passwordResetNew").val(),
            confirm_password:$("#passwordResetConfirm").val(),csrf_token:csrfToken
        })}).done(function(data){
            $("#passwordResetForm").prop("hidden",true);
            setAuthView("login");
            $("#authPassword").val("");
            authMessage(data.message||"Your password has been reset. You can now log in.",true);
        }).fail(function(xhr){const msg=xhr.responseJSON&&xhr.responseJSON.error?xhr.responseJSON.error:"Password reset failed. Please try again.";$("#passwordResetMessage").text(msg);})
          .always(function(){$button.prop("disabled",false);});
    });
    $("#authLogout").on("click",function(){
        $.ajax({url:"/api/logout",method:"POST",contentType:"application/json",data:JSON.stringify({csrf_token:csrfToken})})
            .done(function(data){csrfToken=data.csrf_token||"";setAuthView("login");$authForm[0].reset();refreshAccount();});
    });
    $(document).on("keydown",function(event){if(event.key==="Escape"&&!$authDialog.prop("hidden"))closeAuth();});
    setAuthView("login");
    refreshAccount();
    const accountIntent = new URLSearchParams(window.location.search).get("account");
    if (accountIntent === "login" || accountIntent === "register") {
        setAuthView(accountIntent === "register" ? "register" : "login");
        openAuth();
    }

    // Toggle chat box
    
$('.ai-button, .close-btn').click(function(){
    $chatBox.toggle();

    if($chatBox.is(':visible')) {
        $input.focus();
    }
});

// Keyboard activation for the floating assistant and its close control.
$(document).on("keydown.assistant-keyboard", ".ai-button, .close-btn", function(event){
    if(event.key === "Enter" || event.key === " "){
        event.preventDefault();
        $(this).trigger("click");
    }
});

// Add message helper
function addMessage(text, sender){
    $chatBody.append(
        $('<div>')
            .addClass('message ' + sender)
            .text(text)
    );

    $chatBody.scrollTop($chatBody[0].scrollHeight);
}

let chatHistory = [];
// Send message function
function sendMessage(){
    const question = $input.val().trim();

    if(question === "") {
        alert("Please enter a question!");
        return;
    }

    addMessage(question, 'user');
    $input.val('');

    addMessage('Fridget is typing...', 'ai');

    chatHistory.push({
        role: "user",
        content: question
    });

    $.ajax({
        url: "/chat",
        method: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
            message: question,
            history: chatHistory
        }),

        success: function(response){
            $chatBody.find('.message.ai:last').remove();

            let reply = response.reply;

            addMessage(reply || "I couldn't generate a response.", 'ai');

            chatHistory.push({
                role: "user",
                content: question
    });
        },

        error: function(xhr){
            $chatBody.find('.message.ai:last').remove();

            console.error("Fridget AI error:", xhr.status, xhr.responseText);

            addMessage(
                xhr.responseJSON?.error || "⚠ Error connecting to server.",
                'ai'
            );
        }
    });
}

// Click send button
$('#sendBtn').click(sendMessage);

// Press Enter to send
$input.keypress(function(e){
    if(e.which == 13) {
        e.preventDefault();
        sendMessage();
    }
});


});
