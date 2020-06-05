const socket = io();

const msgFormInput = document.getElementById("msg");
const messages = document.getElementById("messages");

const msgTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoScroll = () => {
    const newMsg = messages.lastElementChild;
    const newMsgStyle = getComputedStyle(newMsg);
    const newMsgMargin = parseInt(newMsgStyle.marginBottom);
    const newMsgHeight = newMsg.offsetHeight + newMsgMargin;
    const visibleHeight = messages.offsetHeight;
    const contentHeight = messages.scrollHeight;
    const scrollOffset = messages.scrollTop + visibleHeight;
    if (contentHeight - newMsgHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
};

socket.on("message", (msg) => {
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format("h:mm A"),
    });
    messages.insertAdjacentHTML("beforeend", html);
    autoScroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector("#sidebar").innerHTML = html;
});

const sendHandler = (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg").value;
    msgFormInput.value = "";
    msgFormInput.focus();
    socket.emit("sendMessage", msg, (error) => {
        if (error) {
            console.log(error);
        }
        console.log("Delivered");
    });
};

socket.emit(
    "join",
    {
        username,
        room,
    },
    (error) => {
        if (error) {
            alert(error);
            location.href = "/";
        }
    }
);

const form = document.getElementById("msg-form");
form.addEventListener("submit", sendHandler);
