const express = require(`express`)
const app = express()
app.use(express.json())
const kamarController = require(`../controller/kamar_controller`)
const auth =require("../auth/auth")



app.get("/getAllKamar", kamarController.getAllKamar)
app.post("/findKamar", kamarController.findKamar)
app.post("/addKamar", auth.authVerify,kamarController.addKamar)
app.put("/updateKamar/:id", auth.authVerify,kamarController.updateKamar)
app.delete("/deleteKamar/:id", auth.authVerify,kamarController.deleteKamar)
app.post("/find/available", kamarController.findRoomByFilterDate)


module.exports = app