const { request, response } = require("express");
const { Sequelize } = require('sequelize');
const kamarModel = require("../models/index").kamar;
const tipe_kamarModel = require("../models/index").tipe_kamar;
const detailOfPemesananModel = require(`../models/index`).detail_pemesanan
const Op = require("sequelize").Op;
const sequelize = new Sequelize("hotel_new", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

exports.getAllKamar = async (request, response) => {
    let kamars = await kamarModel.findAll({
    include: {
      model: tipe_kamarModel,
      attributes: ['nama_tipe_kamar']
    }
  });
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
                { id:  keyword  },
                { nomor_kamar: { [Op.substring]: keyword } },
            ],
        },
        include: {
          model: tipe_kamarModel,
          attributes: ['nama_tipe_kamar']
        }
    });
    return response.json({
        success: true,
        data: kamars,
        message: "All rooms have been loaded",
    });
};

exports.addKamar = async (request, response) => {
    let nama_tipe_kamar = request.body.nama_tipe_kamar;
  let tipeId = await tipe_kamarModel.findOne({
    where: {
      [Op.and]: [{ nama_tipe_kamar: { [Op.substring]: nama_tipe_kamar } }],
    },
  });
  console.log(tipeId);

  if (tipeId === null) {
    return response.json({
      success: false,
      message: `Tipe kamar yang anda inputkan tidak ada`,
    });
  } else {
    let newRoom = {
      nomor_kamar: request.body.nomor_kamar,
      tipeKamarId: tipeId.id,
    };

    if (newRoom.nomor_kamar === "" || nama_tipe_kamar === "") {
      return response.json({
        success: false,
        message: `Mohon diisi semua`,
      });
    }

    let kamars = await kamarModel.findAll({
      where: {
        [Op.and]: [
          { nomor_kamar: newRoom.nomor_kamar },
          { tipeKamarId: newRoom.tipeKamarId },
        ],
      },
      attributes: ["id", "nomor_kamar", "tipeKamarId"],
    });
    if (kamars.length > 0) {
      return response.json({
        success: false,
        message: `Kamar yang anda inputkan sudah ada`,
      });
    }
    kamarModel
      .create(newRoom)
      .then((result) => {
        return response.json({
          success: true,
          data: result,
          message: `New Room has been inserted`,
        });
      })
      .catch((error) => {
        return response.json({
          success: false,
          message: error.message,
        });
      });
  }


    // let newKamar = {
    //     nomor_kamar: request.body.nomor_kamar,
    //     tipeKamarId: request.body.tipeKamarId,
    // };
    // let tipe_kamar = await tipe_kamarModel.findOne({
    //     where: {
    //         id: newKamar.tipeKamarId,
    //     },
    // });
    // console.log(tipe_kamar.id);
    // let tes = newKamar.tipeKamarId == tipe_kamar.id;
    // console.log(tes);
    // if (tes) {
    //     kamarModel
    //         .create(newKamar)
    //         .then((result) => {
    //             return response.json({
    //                 success: true,
    //                 data: result,
    //                 message: `New room has been inserted`,
    //             });
    //         })
    //         .catch((error) => {
    //             return response.json({
    //                 success: false,
    //                 message: error.message,
    //             });
    //         });
    // } else {
    //     return response.json({
    //         success: false,
    //         message: "Room types doesn't exist",
    //     });
    // }
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

exports.findRoomByFilterDate = async (req, res) => {
  const tgl_check_in = req.body.tgl_check_in;
  const tgl_check_out = req.body.tgl_check_out;
  
  const result = await sequelize.query(
    `SELECT DISTINCT tipe_kamars.* FROM tipe_kamars LEFT JOIN kamars ON tipe_kamars.id = kamars.tipeKamarId WHERE tipe_kamars.id IN (SELECT kamars.tipeKamarId FROM kamars LEFT JOIN tipe_kamars ON kamars.tipeKamarId = tipe_kamars.id LEFT JOIN detail_pemesanans ON detail_pemesanans.kamarId = kamars.id WHERE kamars.id NOT IN (SELECT kamarId from detail_pemesanans WHERE tgl_akses BETWEEN '${tgl_check_in}' AND '${tgl_check_out}') GROUP BY kamars.nomor_kamar);`
  );

   return res.status(200).json({
    message: "Success to get available room by type room",
    code: 200,
    success: true,
    sisa_kamar: result[0].length,
    data: result[0],
    message: `Room have been loaded`,
  });

  // return response.json({
  //   success: true,
  //   sisa_kamar: result[0].length,
  //   data: result[0],
  //   message: `Room have been loaded`,
  // });


  // const checkInDate = req.body.tgl_check_in;
  // const checkOutDate = req.body.tgl_check_out;

  // if (checkInDate === "" || checkOutDate === "") {
  //   return res.status(200).json({
  //     message: "null",
  //     code: 200,
  //     room: []
  //   });
  // }

  // const roomData = await tipe_kamarModel.findAll({
  //   attributes: ["id", "nama_tipe_kamar", "harga", "deskripsi", "foto"],
  //   include: [
  //     {
  //       model: kamarModel,
  //       as: "kamar",
  //     }
  //   ]
  // });

  // const roomBookedData = await tipe_kamarModel.findAll({
  //   attributes: ["id", "nama_tipe_kamar", "harga", "deskripsi", "foto"],
  //   include: [
  //     {
  //       model: kamarModel,
  //       as: "kamar",
  //       include: [
  //         {
  //           model: detailOfPemesananModel,
  //           as: "detail_pemesanan",
  //           attributes: ["tgl_akses"],
  //           where: {
  //             tgl_akses: {
  //               [Op.between]: [checkInDate, checkOutDate]
  //             }
  //           },
  //         }
  //       ]
  //     }
  //   ]
  // });

  // const available = [];
  // const availableByType = [];

  // for (let i = 0; i < roomData.length; i++) {
  //   const room = roomData[i].kamar;

  //   if (!room || !Array.isArray(room)) {
  //     continue;
  //   }

  //   let isBooked = false;
  //   for (const booked of roomBookedData) {
  //     const bookedRoom = booked.kamar;
  //     if (bookedRoom && Array.isArray(bookedRoom)) {
  //       for (const bookedKamar of bookedRoom) {
  //         if (room.some((r) => r.id === bookedKamar.kamarId)) {
  //           isBooked = true;
  //           break;
  //         }
  //       }
  //     }

  //     if (isBooked) {
  //       break;
  //     }
  //   }

  //   if (!isBooked) {
  //     available.push(...room);
  //   }
  // }

  // for (let i = 0; i < roomData.length; i++) {
  //   const roomType = {};
  //   roomType.id = roomData[i].id;
  //   roomType.nama_tipe_kamar = roomData[i].nama_tipe_kamar;
  //   roomType.harga = roomData[i].harga;
  //   roomType.deskripsi = roomData[i].deskripsi;
  //   roomType.foto = roomData[i].foto;
  //   roomType.kamar = [];

  //   // Filter kamar yang tersedia
  //   const availableKamar = roomData[i].kamar.filter(
  //     (kamar) => !kamar.detail_pemesanan || kamar.detail_pemesanan.length === 0
  //   );
  //   roomType.kamar.push(...availableKamar);

  //   if (roomType.kamar.length > 0) {
  //     availableByType.push(roomType);
  //   }
  // }

  // return res.status(200).json({
  //   message: "Success to get available room by type room",
  //   code: 200,
  //   roomAvailable: available,
  //   roomAvailableCount: available.length,
  //   room: availableByType,
  //   typeRoomCount: availableByType.length
  // });
};
