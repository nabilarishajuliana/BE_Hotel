const express = require(`express`)
const app = express()
app.use(express.json())
const pemesananController = require(`../controller/pemesanan_controller`)


app.get("/getAllKamar", pemesananController.getAllPemesanan)
// app.get("/getPemesanan", pemesananController.getPemesanan)
app.post("/findPemesanan", pemesananController.findPemesanan)
app.post("/addPemesanan", pemesananController.addPemesanan)
app.put("/updateKamar/:id", pemesananController.updatePemesanan)
app.delete("/deleteKamar/:id", pemesananController.deletePemesanan)
app.put("/status/:id", pemesananController.updateStatusBooking)

module.exports = app