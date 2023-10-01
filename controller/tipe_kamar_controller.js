const { request, response } = require("express")
const tipekamarModel = require(`../models/index`).tipe_kamar

const Op = require(`sequelize`).Op
// const md5 = require('md5')


/** load library 'path' and 'filestream' */
const path = require(`path`)
const fs = require(`fs`)

const upload = require(`./upload-cover`).single(`foto`)




exports.getAllTipeKamar = async (request, response) => {
    let tipe_kamars = await tipekamarModel.findAll()
    return response.json({
        success: true,
        data: tipe_kamars,
        message: `semua data sukses ditampilkan`
    })
}

exports.findTipeKamar = async (request, response) => {
    let nama_tipe_kamar = request.body.keyword
    // let harga = request.body.harga
    let tipe_kamars = await tipekamarModel.findAll({
        where: {
            [Op.and]: [
                { nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } },
                // { harga: { [Op.substring]: harga } },
            ]
        }
    })
    return response.json({
        success: true,
        data: tipe_kamars,
        message: `ini tipe kamar yang anda cari yang mulia`
    })
}

exports.addTipeKamar = (request, response) => {
    upload(request, response, async error => {
        if (error) {
            return response.json({ message: error })
        }

        if (!request.file) {
            return response.json({
                message: `Nothing to Upload(minimal upload file sek lah!)`
            })
        }

        let newTipeKamar = {
            nama_tipe_kamar: request.body.nama_tipe_kamar,
            harga: request.body.harga,
            deskripsi: request.body.deskripsi,
            foto: request.file.filename,

        }

        tipekamarModel.create(newTipeKamar).then(result => {
            return response.json({
                success: true,
                data: result,
                message: `tipe kamar telah ditambahkan`
            })
        })

            .catch(error => {
                return response.json({
                    success: false,
                    message: error.message
                })
            })
    })
}

exports.updateTipeKamar = async (request, response) => {
    upload(request, response, async error => {
        if (error) {
            return response.json({ message: error })
        }
        let id = request.params.id
        let tipe_kamar = {
            nama_tipe_kamar: request.body.nama_tipe_kamar,
            harga: request.body.harga,
            deskripsi: request.body.deskripsi,
            // foto: request.file.foto,
            
        }
        
        if (request.file) {
            const selectedTipeKamar = await tipekamarModel.findOne({
                where: { id: id }
            })
            
            const oldFotoTipeKamar = selectedTipeKamar.foto
            const pathFoto = path.join(__dirname, `../foto`, oldFotoTipeKamar)
            
            if (fs.existsSync(pathFoto)) {
                fs.unlink(pathFoto, error =>
                    console.log(error))
                }
                tipe_kamar.foto = request.file.filename
            }
            
            tipekamarModel.update(tipe_kamar, { where: { id: id } })
            .then(result => {
                return response.json({
                    success: true,
                    message: `Data terupdate`
                })
            })
            .catch(error => {
                return response.json({

                })
            })
        })
}

exports.deleteTipeKamar = async (request, response) => {
    const id = request.params.id
    // const tipe_kamar = await tipekamarModel.findOne({ where: { id: id } })
    // const oldFotoTipeKamar = tipe_kamar.foto
    // const pathFoto = path.join(__dirname, `../foto`, oldFotoTipeKamar)

    // if (fs.existsSync(pathFoto)) {
    //     fs.unlink(pathFoto, error => console.log(error))
    // }

    tipekamarModel.destroy({ where: { id: id } })
        .then(result => {
            return response.json({
                success: true,
                message: `Data tipe kamar has been deleted`
            })
        })
        .catch(error => {
            return response.json({
                success: false, 
                message: error.message
            })
        })
}


