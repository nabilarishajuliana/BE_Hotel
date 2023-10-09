const express = require(`express`)
const app = express()
app.use(express.json())
const tipekamarController = require(`../controller/tipe_kamar_controller`)
const auth =require("../auth/auth")



app.get("/getAllTipe", tipekamarController.getAllTipeKamar)
app.post("/findTipeKamar", auth.authVerify,tipekamarController.findTipeKamar)
app.post("/addTipeKamar", auth.authVerify,tipekamarController.addTipeKamar)
app.put("/updateTipeKamar/:id", auth.authVerify,tipekamarController.updateTipeKamar)
app.delete("/deleteTipeKamar/:id", auth.authVerify,tipekamarController.deleteTipeKamar)

module.exports = app