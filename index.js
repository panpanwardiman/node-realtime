import http from "http"
import  express from "express"
import logger from "morgan"
import cors from "cors"
import socketio from "socket.io"

// mongo connection 
import "./src/config/mongo.js"

import WebSocket from "./src/utils/WebSocket.js"

// routes
import indexRouter from "./src/routes/index.js"
import userRouter from "./src/routes/user.js"
import chatRoomRouter from "./src/routes/chatRoom.js"
import deleteRouter from "./src/routes/delete.js"

import {decode} from "./src/middlewares/jwt.js"

const app = express()

const port = process.env.PORT || 3000
app.set("port", port)

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use('/', indexRouter)
app.use('/users', userRouter)
app.use('/room', decode, chatRoomRouter)
app.use('/delete', deleteRouter)  

app.use('*', (req, res) => {
    return res.status(404).json({
        success: false,
        message: 'API enpoint doesn\'t exist'
    })
})

const server = http.createServer(app)
global.io = socketio.listen(server)
global.io.on("connection", WebSocket.connection)
server.listen(port)
server.on('listening', () => {
    console.log(`listening on port:: http://localhost:${port}/`)
})
