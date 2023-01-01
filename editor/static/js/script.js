// Editor
let editor = document.querySelector(".editor");
let rect = editor.getBoundingClientRect();
let textarea = document.querySelector(".editing");
let saveBtn = document.querySelector(".save");
let result_element = document.querySelector("#highlighting-content");
editor.style.setProperty("height", `${window.innerHeight - rect.top}px`);
let connectionBtn = document.querySelector(".generate_code");
let codeToShare = document.querySelector(".share_code");
let shareBtn = document.querySelector(".share");
let notificationBtn = document.querySelector(".notifications");
let notificationContainer = document.querySelector(".notification_container");
let languageSelect = document.querySelector(".language_btn select");
let namePrompt = document.querySelector(".share_prompt");
const TTL = 5 * 60 * 60 * 1000;

const languages = {
    aspnet: "ASP.NET (C#)",
    basic: "BASIC",
    cobol: "COBOL",
    cpp: "C++",
    csharp: "C#",
    css: "CSS",
    dockerfile: "Docker",
    gitignore: ".gitignore",
    graphql: "GraphQL",
    hs: "Haskell",
    html: "HTML",
    java: "Java",
    js: "JavaScript",
    json: "JSON",
    jsx: "React JSX",
    kt: "Kotlin",
    md: "Markdown",
    mongodb: "MongoDB",
    objectivec: "Objective-C",
    php: "PHP",
    py: "Python",
    qsharp: "Q#",
    rb: "Ruby",
    sass: "Sass (Sass)",
    scss: "Sass (SCSS)",
    solidity: "Solidity (Ethereum)",
    sql: "SQL",
    svg: "SVG",
    ts: "TypeScript",
    tsx: "React TSX",
    "visual-basic": "Visual Basic",
    wasm: "WebAssembly",
    xml: "XML",
    yaml: "YAML"
};

document.addEventListener("DOMContentLoaded", () => {
    // Load notifications from localstorage
    let isnotification = loadNotifications();
    setWithExpiry("unseenNotificationsCount", 0);

    // Add languages options to select btn
    Object.entries(languages).forEach((lang) => {
        let option = document.createElement("option");
        option.setAttribute("value", lang[0]);
        option.innerText = lang[1];
        languageSelect.appendChild(option);
    });

    let unseenNotificationsCount = getWithExpiry("unseenNotificationsCount");

    unseenNotificationsCount &&
        notificationBtn.style.setProperty(
            "--notifications",
            `"${unseenNotificationsCount}"`
        );

    if (language === "") {
        language = getWithExpiry("language");
    } else {
        languageSelect.disabled = true;
    }

    if (language) {
        languageSelect.value = language;
        languageSelect.dispatchEvent(new Event("change"));
    }

    // Style code
    if (textarea) {
        update(textarea.value);
        setTimeout(() => {
            update(textarea.value);
        }, 0);
    }
});

document.addEventListener("click", () => {
    if (!notificationContainer.classList.contains("hidden")) {
        notificationContainer.classList.add("hidden");
    }
});

codeToShare &&
    codeToShare.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            openNamePrompt();
        }
    });

languageSelect.addEventListener("change", () => {
    setWithExpiry("language", languageSelect.value, TTL);
    result_element.className = `language-${languageSelect.value}`;
    update(textarea.value);
});

notificationBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notificationContainer.classList.toggle("hidden");
    localStorage.removeItem("unseenNotificationsCount");
    notificationBtn.style.removeProperty("--notifications");
});

shareBtn && shareBtn.addEventListener("click", openNamePrompt);

function openNamePrompt() {
    namePrompt.classList.remove("hidden");
    nameInput = namePrompt.querySelector("input");
    nameInput.focus();
    nameInput.addEventListener("keypress", shareCode);
    namePrompt.querySelector(".btn").addEventListener("click", shareCode);
    namePrompt.querySelector("i").addEventListener("click", () => {
        namePrompt.classList.add("hidden");
        nameInput.removeEventListener("keypress", shareCode);
        namePrompt
            .querySelector(".btn")
            .removeEventListener("click", shareCode);
    });
}

connectionBtn.addEventListener("click", async () => {
    if (connectionBtn.innerText === "Generate Code") {
        createConnection();
    } else {
        let code = connectionBtn.innerText;
        if (await copyToClipboard(connectionBtn.innerText)) {
            connectionBtn.innerText = "Copied";
            connectionBtn.style.backgroundColor = "#20e655";
            setTimeout(() => {
                connectionBtn.innerText = code;
                connectionBtn.style.backgroundColor = "white";
            }, 2000);
        }
    }
});

saveBtn && saveBtn.addEventListener("click", saveCode);

function openCode(e) {
    let url =
        "http://" +
        window.location.host +
        "/" +
        e.currentTarget.getAttribute("codeurl");

    window.location.href = url;
}

async function shareCode(e) {
    if (!(e.type === "click" || (e.type === "keypress" && e.key === "Enter"))) {
        return;
    }

    let sharer = namePrompt.querySelector("input").value;
    namePrompt.classList.add("hidden");

    namePrompt
        .querySelector("input")
        .removeEventListener("keypress", shareCode);
    namePrompt.querySelector(".btn").removeEventListener("click", shareCode);

    if (window.location.protocol == "https:") {
        wsProtocol = "wss://";
    } else {
        wsProtocol = "ws://";
    }
    let chatSocket = new WebSocket(
        wsProtocol + window.location.host + "/ws/join/" + codeToShare.value
    );

    chatSocket.onopen = () => {
        chatSocket.send(
            JSON.stringify({
                codeUrl: id,
                sharer
            })
        );
        chatSocket.close();
    };
}

function loadNotifications(codeUrl) {
    let notifications = getWithExpiry("notifications");

    notifications &&
        notifications.forEach((data) => {
            let notification = createNotification(
                data["codeUrl"],
                data["sharer"]
            );
            notification.addEventListener("click", openCode);
            notificationContainer.appendChild(notification);
        });

    return !!notifications;
}

async function createConnection() {
    if (window.location.protocol == "https:") {
        wsProtocol = "wss://";
    } else {
        wsProtocol = "ws://";
    }
    let chatSocket = new WebSocket(
        wsProtocol + window.location.host + "/ws/create"
    );

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        if ("room_name" in data) connectionBtn.innerText = data["room_name"];
        if ("codeUrl" in data) {
            let codeUrl = data["codeUrl"];
            let sharer = data["sharer"];
            let notifications = getWithExpiry("notifications");
            let unseenNotificationsCount = getWithExpiry(
                "unseenNotificationsCount"
            );

            if (notifications === null) {
                setWithExpiry(
                    "notifications",
                    [{ codeUrl: codeUrl, sharer: sharer }],
                    TTL
                );
                notifications = [{ codeUrl: codeUrl, sharer: sharer }];
            } else {
                notifications.push({ codeUrl: codeUrl, sharer: sharer });
                setWithExpiry("notifications", notifications, TTL);
            }

            if (unseenNotificationsCount === null) {
                setWithExpiry("unseenNotificationsCount", 1, TTL);
                notificationBtn.style.setProperty("--notifications", "'1'");
            } else {
                unseenNotificationsCount += 1;
                setWithExpiry(
                    "unseenNotificationsCount",
                    unseenNotificationsCount,
                    TTL
                );
                notificationBtn.style.setProperty(
                    "--notifications",
                    `"${unseenNotificationsCount}""`
                );
            }

            let notification = createNotification(codeUrl, sharer);
            notification.addEventListener("click", openCode);
            notificationContainer.appendChild(notification);
        }
    };

    chatSocket.onclose = function (e) {
        connectionBtn.innerHTML = "Generate Code";
    };
}

function createNotification(codeUrl, sharer) {
    let notification = document.createElement("div");
    notification.innerHTML = `<span>Hey! ${
        sharer === "" ? "Someone" : sharer
    } has sent you a code</span>
    <span>Click to open it</span>`;
    notification.setAttribute("codeurl", codeUrl);
    return notification;
}

async function saveCode() {
    let data = { language: languageSelect.value, code: textarea.value };

    let res = await fetch("/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify(data)
    });
    window.location.href = res.url;
}

function update(text) {
    // Handle final newlines
    if (text[text.length - 1] == "\r") {
        text = text.slice(0, text.length - 2) + "\n";
    }
    if (text[text.length - 1] == "\n") {
        // If the last character is a newline character
        text += " "; // Add a placeholder space character to the final line
    }
    // Update code
    result_element.innerHTML = text
        .replace(new RegExp("&", "g"), "&amp")
        .replace(new RegExp("<", "g"), "&lt"); /* Global RegExp */
    // Syntax Highlight
    Prism.highlightElement(result_element);
}

function sync_scroll(element) {
    /* Scroll result to scroll coords of event - sync with textarea */
    let result_element = document.querySelector(".highlighting");
    // Get and set x and y
    result_element.scrollTop = element.scrollTop;
    result_element.scrollLeft = element.scrollLeft;
}

function check_tab(element, event) {
    let code = element.value;
    if (event.key == "Tab") {
        /* Tab key pressed */
        event.preventDefault(); // stop normal
        let before_tab = code.slice(0, element.selectionStart); // text before tab
        let after_tab = code.slice(element.selectionEnd, element.value.length); // text after tab
        let cursor_pos = element.selectionEnd + 1; // where cursor moves after tab - moving forward by 1 char to after tab
        element.value = before_tab + "\t" + after_tab; // add tab char
        // move cursor
        element.selectionStart = cursor_pos;
        element.selectionEnd = cursor_pos;
        update(element.value); // Update text to include indent
    }
}

function setWithExpiry(key, value, ttl) {
    const now = new Date();

    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = {
        value: value,
        expiry: now.getTime() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);

    // if the item doesn't exist, return null
    if (!itemStr) {
        return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        return false;
    }
}
