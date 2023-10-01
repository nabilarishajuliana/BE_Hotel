
const express = require(`express`) /** load library express */
const app = express() /** create object that instances of express */ 
const PORT = 8000 /** define port of server */ 

//ini cors
const cors = require(`cors`) /** load library cors */ 
app.use(cors()) /** open CORS policy */

//ini body parser
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("foto"))


/** define all routes */
const userRoute = require("./routes/user_routes") 
const tipekamarRoute = require("./routes/tipe_kamar_routes") 
const kamarRoute = require("./routes/kamar_routes") 
const pemesananRoute = require("./routes/pemesanan_routes") 


// const adminRoute = require("./routes/admin_routes")

/** define prefix for each route */ 
app.use('/user', userRoute)
app.use('/tipeKamar', tipekamarRoute)
app.use('/kamar', kamarRoute)
app.use('/pemesanan', pemesananRoute)


// app.use(`/admin`, adminRoute)

/** run server based on defined port */
app.listen(PORT, () => {
    console.log(`Server of hotel runs on port${PORT}`)
    })
    