const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponsingGenerating = false;

// API configuration.
const API_KEY = "AIzaSyD6tFRkcUEiE0pwZsAG35OknfVk1zpTn9g";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode")

    // Apply the stored theme.
    document.body.classList.toggle("light_mode", isLightMode)
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore Saved Chats.
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scroll(0, chatList.scrollHeight); // Scroll to the bottom.
};

loadLocalStorageData();

// Crestes a new message element and return it.
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Show typing effect by displaying words one by one.
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;
    
    const typingInterval = setInterval(() => {
        // Append each word to the text element with a space.
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        
        // If all words are displayed.
        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponsingGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); // Save chats to local storage.
        }
        chatList.scroll(0, chatList.scrollHeight); // Scroll to the bottom.
    }, 75)
}

// Fetch response from the API based on user message.
const generateAPIResponse = async(incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); // Get Text Element.

    // Send a POST request to the API with the user's message.
    try{
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message)

        // Get the API response text and remove astrisks from it.
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch(error) {
        isResponsingGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

// Show a loading animation while waiting for the API response.
const showLoadingAnimation = () => {
    const HTML = `
        <div class="message-content">
            <img src="images 2/gemini.svg" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
            </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
    `;

    const incomingMessageDiv = createMessageElement(HTML, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scroll(0, chatList.scrollHeight); // Scroll to the bottom.
    generateAPIResponse(incomingMessageDiv);
}

// Copy Message text to the clipboard.
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // Show tick icon.
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Revert Icon after 1 second.
}

// Handle Sending Outgoing Messages.
const handleOutGoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponsingGenerating) return; // if there is no message.

    isResponsingGenerating = true;

    const HTML = `
        <div class="message-content">
            <img src="images 2/user.jpg" alt="User Image" class="avatar">
            <p class="text"></p>
        </div>
    `;

    const outgoingMessageDiv = createMessageElement(HTML, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear Input Feild.
    chatList.scroll(0, chatList.scrollHeight); // Scroll to the bottom.
    document.body.classList.add("hide-header"); // Hide the header once chat starts.
    setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay.
}

// Set userMessage and handle outgoing caht when a suggestion is clicked.
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutGoingChat();
    })
})

// Toggle between light and dark themes.
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats from local storage when button is cicked.
deleteChatButton.addEventListener("click", () => {
    if(confirm("Are You Sure You Want To Delete All Messages")) {
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
})

// Prevent default form submission and handle outgoing chat.
typingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    handleOutGoingChat();
})