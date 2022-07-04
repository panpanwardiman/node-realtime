import express from "express"
import users from "../controllers/user.js"
import {encode} from "../middlewares/jwt.js"

const router = express.Router()

router.post('/login/:userId', encode, (req, res, next) => {
    return res.status(200).json({
        success: true,
        authorization: req.authToken
    })
})

export default router