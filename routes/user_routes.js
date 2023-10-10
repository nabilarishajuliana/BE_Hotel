const express = require('express')
const app = express()
app.use(express.json())
const auth =require("../auth/auth")

const userController = require('../controller/user_controller')

app.post("/login", userController.login)
app.get("/getAllUser", userController.getAllUser)
app.post("/addUser",  userController.addUser)
app.post("/findUser", userController.findUser)
app.put("/updateUser/:id", auth.authVerify, userController.updateUser)
app.delete("/deleteUser/:id", auth.authVerify, userController.deleteUser)
module.exports = app