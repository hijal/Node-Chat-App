const express = require("express");
const path = require("path");
const socketIO = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");
const {
    addUser,
    getUser,
    removeUser,
    getUsersInRoom,
} = require("./utils/users");

const app = express();

const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "../public")));

const server = express()
    .use(app)
    .listen(port, () => console.log(`Listening Socket on ${port}`));

const io = socketIO(server);

io.on("connection", (socket) => {
    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit(
            "message",
            generateMessage(
                "Hello " +
                    user.username.replace(/\b\w/g, (l) => l.toUpperCase()) +
                    " !! Welcome! to the chat room."
            )
        );
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage(
                    "Admin",
                    `${user.username.replace(/\b\w/g, (l) =>
                        l.toUpperCase()
                    )} has joined!`
                )
            );

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        callback();
    });

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed!");
        }

        io.to(user.room).emit(
            "message",
            generateMessage(
                user.username.replace(/\b\w/g, (l) => l.toUpperCase()),
                message
            )
        );
        callback();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage(
                    "Admin",
                    `${user.username.replace(/\b\w/g, (l) =>
                        l.toUpperCase()
                    )} has left!`
                )
            );
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});
