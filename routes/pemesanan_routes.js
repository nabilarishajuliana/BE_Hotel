const express = require(`express`)
const app = express()
app.use(express.json())
const pemesananController = require(`../controller/pemesanan_controller`)
const auth =require("../auth/auth")



app.get("/getAllKamar", pemesananController.getAllPemesanan)
app.get("/customer/:id_customer",auth.authVerify, pemesananController.findBookingByIdCustomer)
// app.get("/getPemesanan", pemesananController.getPemesanan)
app.post("/findPemesanan", pemesananController.findPemesanan)
app.post("/addPemesanan",auth.authVerify, pemesananController.addPemesananNew)
app.put("/updateKamar/:id", pemesananController.updatePemesanan)
app.delete("/deleteKamar/:id", pemesananController.deletePemesanan)
app.put("/status/:id", auth.authVerify,pemesananController.updateStatusBooking)
app.post("/find/filter/:id_customer",auth.authVerify, pemesananController.findBookingDataFilter)


module.exports = app