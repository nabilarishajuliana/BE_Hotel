const { request, response } = require("express");
const kamarModel = require("../models/index").kamar;
const tipe_kamarModel = require("../models/index").tipe_kamar;
const Op = require("sequelize").Op;

exports.getAllKamar = async (request, response) => {
    let kamars = await kamarModel.findAll();
    return response.json({
        success: true,
        data: kamars,
        message: "All rooms have been loaded",
    });
};

exports.findKamar = async (request, response) => {
    let keyword = request.body.keyword;
    let kamars = await kamarModel.findAll({
        where: {
            [Op.or]: [
                { id: { [Op.substring]: keyword } },
                { nomor_kamar: { [Op.substring]: keyword } },
            ],
        },
    });
    return response.json({
        success: true,
        data: kamars,
        message: "All rooms have been loaded",
    });
};

exports.addKamar = async (request, response) => {
    let newKamar = {
        nomor_kamar: request.body.nomor_kamar,
        tipeKamarId: request.body.tipeKamarId,
    };
    let tipe_kamar = await tipe_kamarModel.findOne({
        where: {
            id: newKamar.tipeKamarId,
        },
    });
    console.log(tipe_kamar.id);
    let tes = newKamar.tipeKamarId == tipe_kamar.id;
    console.log(tes);
    if (tes) {
        kamarModel
            .create(newKamar)
            .then((result) => {
                return response.json({
                    success: true,
                    data: result,
                    message: `New room has been inserted`,
                });
            })
            .catch((error) => {
                return response.json({
                    success: false,
                    message: error.message,
                });
            });
    } else {
        return response.json({
            success: false,
            message: "Room types doesn't exist",
        });
    }
};

exports.updateKamar = async (request, response) => {
    let dataKamar = {
        nomor_kamar: request.body.nomor_kamar,
        tipeKamarId: request.body.tipeKamarId,
    };
    let id = request.params.id;
    kamarModel
        .update(dataKamar, { where: { id: id } })
        .then((result) => {
            return response.json({
                success: true,
                message: `Data room has been updated`,
            });
        })
        .catch((error) => {
            return response.json({
                success: false,
                message: error.message,
            });
        });
};

exports.deleteKamar = (request, response) => {
    let id = request.params.id;
    kamarModel
        .destroy({ where: { id: id } })
        .then((result) => {
            return response.json({
                success: true,
                message: `Data room has been updated`,
            });
        })
        .catch((error) => {
            return response.json({
                success: false,
                message: error.message,
            });
        });
};