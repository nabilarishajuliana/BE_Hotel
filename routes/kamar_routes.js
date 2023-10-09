const express = require(`express`)
const app = express()
app.use(express.json())
const kamarController = require(`../controller/kamar_controller`)
const auth =require("../auth/auth")



app.get("/getAllKamar", kamarController.getAllKamar)
app.post("/findKamar", kamarController.findKamar)
app.post("/addKamar", kamarController.addKamar)
app.put("/updateKamar/:id", kamarController.updateKamar)
app.delete("/deleteKamar/:id", kamarController.deleteKamar)
app.post("/find/available", kamarController.findRoomByFilterDate)


module.exports = app