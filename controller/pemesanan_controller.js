const { request, response } = require("express");
const detailOfPemesananModel = require(`../models/index`).detail_pemesanan;
const pemesananModel = require(`../models/index`).pemesanan;
const modelUser = require(`../models/index`).user;
const kamarModel = require(`../models/index`).kamar;
const tipe_kamarModel = require(`../models/index`).tipe_kamar;

const moment = require(`moment`);
const randomstring = require("randomstring");
const crypto = require("crypto");

const Op = require(`sequelize`).Op;
const Sequelize = require("sequelize");
const sequelize = new Sequelize("hotel_new", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

exports.getAllPemesanan = async (request, response) => {
  try {
    let pemesanans = await pemesananModel.findAll({
      include: {
        model: tipe_kamarModel,
        attributes: ["nama_tipe_kamar"],
      },
    });
    if (pemesanans.length === 0) {
      return response.json({
        success: true,
        data: [],
        message: `Data tidak ditemukan`,
      });
    }
    return response.json({
      success: true,
      data: pemesanans,
      message: `semua data sukses ditampilkan sesuai yang anda minta tuan`,
    });
  } catch {
    response.send("err");
  }
};

exports.findPemesanan = async (request, response) => {
  let status_pemesanan = request.body.keyword;

  let pemesanans = await pemesananModel.findAll({
    where: {
      [Op.or]: [
        { status_pemesanan: { [Op.substring]: status_pemesanan } },
        { nama_tamu: { [Op.substring]: status_pemesanan } },
        { nomor_pemesanan: { [Op.substring]: status_pemesanan } },
      ],
    },
    include: {
      model: tipe_kamarModel,
      attributes: ["nama_tipe_kamar"],
    },
  });

  // if (pemesanans.length === 0) {
  //   return response.status(404).json({
  //     success: false,
  //     message: "Data tidak ditemukan",
  //   });
  // }
  return response.json({
    success: true,
    data: pemesanans,
    message: "All rooms have been loaded",
  });
};

exports.addPemesananNew = async (request, response) => {
  //cek nama_user
  console.log(request.body.nama_user, "lklkk");

  let nama_user = request.body.nama_user; //1
  const userId = await modelUser.findOne({
    where: {
      [Op.and]: [{ nama_user: nama_user }],
    },
  });
  if (userId === null) {
    return response.status(400).json({
      success: false,
      message: `User yang anda inputkan tidak ada`,
    });
  } else {
    //tanggal pemesanan sesuai tanggal hari ini + random string

    let date = moment();
    let tgl_pemesanan = date.format("YYYY-MM-DD");

    // Generate a random string (7 characters in this case)
    const random = randomstring.generate(7);

    // Combine timestamp and random string to create nomorPem
    // let nomorPem = `${Date.now()}_${random}`;
    let nomorPem = request.body.nomor_pemesanan; //8

    let check_in = request.body.tgl_check_in; //2
    let check_out = request.body.tgl_check_out; //3
    const date1 = moment(check_in);
    const date2 = moment(check_out);

    if (date2.isBefore(date1)) {
      return response.status(400).json({
        success: false,
        message: "masukkan tanggal yang benar",
      });
    }
    let tipe_kamar = request.body.tipe_kamar; //4

    let tipeRoomCheck = await tipe_kamarModel.findOne({
      where: {
        [Op.and]: [{ nama_tipe_kamar: tipe_kamar }],
      },
      attributes: [
        "id",
        "nama_tipe_kamar",
        "harga",
        "deskripsi",
        "foto",
        "createdAt",
        "updatedAt",
      ],
    });
    console.log(tipeRoomCheck);
    if (tipeRoomCheck === null) {
      return response.status(400).json({
        success: false,
        message: `Tidak ada tipe kamar dengan nama itu`,
      });
    }
    //mendapatkan kamar yang available di antara tanggal check in dan check out sesuai dengan tipe yang diinput user
    const result = await sequelize.query(
      `SELECT tipe_kamars.nama_tipe_kamar, kamars.nomor_kamar FROM kamars LEFT JOIN tipe_kamars ON kamars.tipeKamarId = tipe_kamars.id LEFT JOIN detail_pemesanans ON detail_pemesanans.kamarId = kamars.id WHERE kamars.id NOT IN (SELECT kamarId from detail_pemesanans WHERE tgl_akses BETWEEN '${check_in}' AND '${check_out}') AND tipe_kamars.nama_tipe_kamar ='${tipe_kamar}' GROUP BY kamars.nomor_kamar`
    );
    //cek apakah ada
    if (result[0].length === 0) {
      return response.status(400).json({
        success: false,
        message: `Kamar dengan tipe itu dan di tanggal itu sudah terbooking`,
      });
    }

    //masukkan nomor kamar ke dalam array
    const array = [];
    for (let index = 0; index < result[0].length; index++) {
      array.push(result[0][index].nomor_kamar);
    }

    //validasi agar input jumlah kamar tidak lebih dari kamar yang tersedia
    if (result[0].length < request.body.jumlah_kamar) {
      //5
      return response.status(400).json({
        success: false,
        message: `hanya ada ${result[0].length} kamar tersedia`,
      });
    }

    //mencari random index dengan jumlah sesuai input jumlah kamar
    let randomIndex = [];
    for (let index = 0; index < request.body.jumlah_kamar; index++) {
      randomIndex.push(Math.floor(Math.random() * array.length));
    }

    //isi data random elemnt dengan isi dari array dengan index random dari random index
    let randomElement = [];
    for (let index = 0; index < randomIndex.length; index++) {
      randomElement.push(Number(array[index]));
    }

    console.log("random index", randomIndex);
    console.log("random", randomElement);

    //isi roomId dengan data kamar hasil randoman
    let roomId = [];
    for (let index = 0; index < randomElement.length; index++) {
      roomId.push(
        await kamarModel.findOne({
          where: {
            [Op.and]: [{ nomor_kamar: randomElement[index] }],
          },
          attributes: [
            "id",
            "nomor_kamar",
            "tipeKamarId",
            "createdAt",
            "updatedAt",
          ],
        })
      );
    }

    console.log("roomid", roomId);

    //dapatkan harga dari id_tipe_kamar dikali dengan inputan jumlah kamar
    let roomPrice = 0;
    let cariTipe = await tipe_kamarModel.findOne({
      where: {
        [Op.and]: [{ id: roomId[0].tipeKamarId }],
      },
      attributes: [
        "id",
        "nama_tipe_kamar",
        "harga",
        "deskripsi",
        "foto",
        "createdAt",
        "updatedAt",
      ],
    });
    roomPrice = cariTipe.harga * request.body.jumlah_kamar;

    let newData = {
      nomor_pemesanan: nomorPem,
      nama_pemesanan: userId.nama_user, //6
      email_pemesanan: userId.email, //7
      tgl_pemesanan: tgl_pemesanan,
      tgl_check_in: check_in,
      tgl_check_out: check_out,
      nama_tamu: request.body.nama_tamu, //8
      jumlah_kamar: request.body.jumlah_kamar, //9
      tipeKamarId: cariTipe.id,
      status_pemesanan: "baru",
      userId: userId.id,
    };

    //menetukan harga dengan cara mengali selisih tanggal check in dan check out dengan harga tipe kamar
    const startDate = moment(newData.tgl_check_in);
    const endDate = moment(newData.tgl_check_out);
    const duration = moment.duration(endDate.diff(startDate));
    const nights = duration.asDays();
    const harga = nights * roomPrice;

    //cek jika ada inputan kosong
    for (const [key, value] of Object.entries(newData)) {
      if (!value || value === "") {
        console.log(`Error: ${key} is empty`);
        return response
          .status(400)
          .json({ error: `${key} kosong mohon di isi` });
      }
    }

    pemesananModel
      .create(newData)
      .then((result) => {
        let pemesananID = result.id;

        let tgl1 = new Date(result.tgl_check_in);
        let tgl2 = new Date(result.tgl_check_out);
        let checkIn = moment(tgl1).format("YYYY-MM-DD");
        let checkOut = moment(tgl2).format("YYYY-MM-DD");

        // check if the dates are valid
        let success = true;
        let message = "";

        //looping detail pemesanan anatar tanggal check in sampai 1 hari sebelum check out agara mudah dalam cek available
        for (
          let m = moment(checkIn, "YYYY-MM-DD");
          m.isBefore(checkOut);
          m.add(1, "days")
        ) {
          let date = m.format("YYYY-MM-DD");

          // isi newDetail dengan id kamar hasil randomana lalu insert dengan di loop sesuai array yang berisi randoman kamar
          let newDetail = [];
          for (let index = 0; index < roomId.length; index++) {
            newDetail.push({
              pemesananId: pemesananID,
              kamarId: roomId[index].id,
              tgl_akses: date,
              harga: harga,
            });
            detailOfPemesananModel
              .create(newDetail[index])
              .then(async (resultss) => {
                let getData = await sequelize.query(
                  `SELECT  pemesanans.id, pemesanans.nomor_pemesanan, pemesanans.nama_pemesanan,pemesanans.email_pemesanan,pemesanans.tgl_pemesanan,pemesanans.tgl_check_in,pemesanans.tgl_check_out,detail_pemesanans.harga,pemesanans.nama_tamu,pemesanans.jumlah_kamar,pemesanans.status_pemesanan, users.nama_user, tipe_kamars.nama_tipe_kamar,tipe_kamars.harga as harga_tipe_kamar, kamars.nomor_kamar FROM pemesanans JOIN tipe_kamars ON tipe_kamars.id = pemesanans.tipeKamarId JOIN users ON users.id=pemesanans.userId JOIN detail_pemesanans ON detail_pemesanans.pemesananId=pemesanans.id JOIN kamars ON kamars.id=detail_pemesanans.kamarId WHERE pemesanans.id=${pemesananID} GROUP BY kamars.id`
                );
                return response.json({
                  success: true,
                  message: `New transactions have been inserted`,
                  data: getData[0],
                  result:resultss
                });
              })
              .catch((error) => {
                return response.status(400).json({
                  success: false,
                  message: error.message,
                });
              });
          }
          console.log(m);
        }
      })
      .catch((error) => {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      });
  }
};

exports.addPemesanan = async (request, response) => {
  // let nomor_kamar = request.body.nomor_kamar;
  // let kamar = await kamarModel.findOne({
  //     where:{
  //         [Op.and]: [{nomor_kamar: {[Op.substring]: nomor_kamar}}],
  //     },
  //     attributes: [
  //         "id",
  //         "nomor_kamar",
  //         "tipeKamarId",
  //         "createdAt",
  //         "updatedAt",
  //       ],
  //       include: {
  //         model : tipe_kamarModel,
  //         attributes: ["harga"]
  //       }
  // });

  try {
    const newPemesanan = {
      nomor_pemesanan: request.body.nomor_pemesanan,
      // nama_pemesanan: request.body.nama_pemesanan, //customer
      // email_pemesanan: request.body.email_pemesanan, // customer
      tgl_pemesanan: request.body.tgl_pemesanan,
      tgl_check_in: request.body.tgl_check_in,
      tgl_check_out: request.body.tgl_check_out,
      nama_tamu: request.body.nama_tamu,
      jumlah_kamar: request.body.jumlah_kamar,
      tipeKamarId: request.body.tipeKamarId,
      status_pemesanan: "baru",
      userId: request.body.userId,
    };

    // buat cek user
    const userData = await modelUser.findOne({
      where: { id: newPemesanan.userId },
    });
    if (userData == null) {
      return res.status(404).json({
        message: "Data not found!",
      });
    }

    newPemesanan.nama_pemesanan = userData.nama_user;
    newPemesanan.email_pemesanan = userData.email;

    // buat cek kamar
    let kamarData = await kamarModel.findAll({
      where: {
        tipeKamarId: newPemesanan.tipeKamarId,
      },
    });

    //buat cek tipe kamar
    let tipeKamarData = await tipe_kamarModel.findAll({
      where: { id: newPemesanan.tipeKamarId },
    });
    if (tipeKamarData == null) {
      return res.status(404).json({
        message: "Data not found!",
      });
    }

    //cek room yang ada pada tabel booking_detail
    let dataBooking = await tipe_kamarModel.findAll({
      where: { id: newPemesanan.tipeKamarId },
      include: [
        {
          model: kamarModel,
          as: "kamar",
          attributes: ["id", "tipeKamarId"],
          include: [
            {
              model: detailOfPemesananModel,
              as: "detail_pemesanan",
              attributes: ["tgl_akses"],
              where: {
                [Op.and]: [
                  { tgl_akses: { [Op.gte]: newPemesanan.tgl_check_in } },
                  { tgl_akses: { [Op.lte]: newPemesanan.tgl_check_out } },
                ],

                // tgl_check_in: {
                //       [Op.between]: [newPemesanan.tgl_check_in, newPemesanan.tgl_check_out]
                //   },
                //   tgl_check_out: {
                //     [Op.between]: [newPemesanan.tgl_check_in, newPemesanan.tgl_check_out]
                // }
              },
            },
          ],
        },
      ],
    });

    // get available rooms
    const bookedRoomIds = dataBooking[0].kamarModel.map((item) => item.id);
    const availableRooms = kamarData.filter(
      (kamar) => !bookedRoomIds.includes(kamar.id)
    );

    //proses add data room yang available to one array
    const roomsDataSelected = availableRooms.slice(
      0,
      newPemesanan.jumlah_kamar
    );

    //count day
    const checkInDate = new Date(newPemesanan.tgl_check_in);
    const checkOutDate = new Date(newPemesanan.tgl_check_out);
    const dayTotal = Math.round(
      (checkOutDate - checkInDate) / (1000 * 3600 * 24)
    );

    //process add booking and detail
    try {
      console.log("booked", bookedRoomIds);
      console.log("avail", availableRooms);
      console.log("select", roomsDataSelected);
      if (
        kamarData == null ||
        availableRooms.length < newPemesanan.jumlah_kamar ||
        dayTotal == 0 ||
        roomsDataSelected == null
      ) {
        console.log("room not found");
        return response.status(404).json({
          message: "Room not found",
          code: 404,
        });
      }

      const result = await pemesananModel.create(newPemesanan);
      //add detail
      for (let i = 0; i < dayTotal; i++) {
        for (let j = 0; j < roomsDataSelected.length; j++) {
          const accessDate = new Date(checkInDate);
          accessDate.setDate(accessDate.getDate() + i);
          const dataDetailBooking = {
            pemesananId: result.id,
            kamarId: roomsDataSelected[j].id,
            tgl_akses: accessDate,
            harga: tipeKamarData[0].harga,
          };
          await detailOfPemesananModel.create(dataDetailBooking);
        }
      }
      return response.status(200).json({
        data: result,
        message: "Success to create booking room",
        code: 200,
      });
    } catch (err) {
      console.log(err);
      return response.status(500).json({
        message: "Error when create booking",
        err: err,
      });
    }
  } catch (err) {
    console.log(err);
    return response.status(500).json({
      message: "Internal error",
      err: err,
    });
  }

  //       if (newPemesanan.nomor_pemesanan === "" ||newPemesanan.nama_pemesanan === "" ||newPemesanan.email_pemesanan === ""||
  //       newPemesanan.tgl_pemesanan === ""||newPemesanan.tgl_check_in === ""||newPemesanan.tgl_check_out === ""||newPemesanan.nama_tamu === ""||
  //       newPemesanan.jumlah_kamar === ""||newPemesanan.tipeKamarId === ""||newPemesanan.status_pemesanan === ""||newPemesanan.userId === "") {
  //         return response.json({
  //           success: false,
  //           message: "Semua data harus diisi",
  //         });
  //       }

  //       let kamarCheck = await sequelize.query(
  //           `SELECT * FROM detail_pemesanans WHERE kamarId = ${kamar.id} AND tgl_akses >= "${request.body.tgl_check_in}" AND tgl_akses <= "${request.body.tgl_check_out}";`
  //         );
  //         if (kamarCheck[0].length === 0) {
  //           const tgl_check_in = new Date(request.body.tgl_check_in);
  //           const tgl_check_out = new Date(request.body.tgl_check_out);
  //           const diffTime = Math.abs(tgl_check_out - tgl_check_in);
  //           const diffDays = Math.ceil(diffTime/(1000*60*60*24));

  //           pemesananModel
  //             .create(newPemesanan)
  //             .then((result) => {
  //               let pemesananID = result.id;
  //               let detailsOfPemesanan = request.body.details_of_pemesanan;
  //               let detailData = [];

  //               for (let i = 0; i < diffDays; i++) {
  //                 let newDetail = {
  //                   pemesananId: pemesananID,
  //                   kamarId:kamar.id,
  //                   tgl_akses: new Date(tgl_check_in.getTime() + i*24*60*60*1000),
  //                   harga: kamar.tipe_kamar.harga,
  //                 };
  //                 detailData.push(newDetail);
  //                 }

  //         detailOfPemesananModel
  //         .bulkCreate(detailData)
  //         .then((result) => {
  //           return response.json({
  //             success: true,
  //             message: `New transaction has been inserted`,
  //           });
  //         })
  //         .catch((error) => {
  //           return response.json({
  //             success: false,
  //             message: error.message,
  //           });
  //         });
  //     })
  //     .catch((error) => {
  //       return response.json({
  //         success: false,
  //         message: error.message,
  //       });
  //     });
  // } else {
  //   return response.json({
  //     success: false,
  //     message: `Kamar yang anda pesan sudah di booking`,
  //   });
  // }

  //     let nama_user = request.body.nama;
  //     let userId = await modelUser.findOne({
  //         where: {
  //           [Op.and]: [{ nama_user: { [Op.substring]: nama_user } } ],
  //         },
  //       });

  //       if (kamar === null) {
  //         return response.json({
  //           success: false,
  //           message: `Kamar yang anda inputkan tidak ada`,
  //         });
  //       } else if (userId === null) {
  //         return response.json({
  //           success: false,
  //           message: `User yang anda inputkan tidak ada`,
  //         });
  //       }else{

  // }
};

exports.updatePemesanan = async (request, response) => {
  let nomor_kamar = request.body.nomor_kamar;
  let kamar = await kamarModel.findOne({
    where: {
      [Op.and]: [{ nomor_kamar: { [Op.substring]: nomor_kamar } }],
    },
    attributes: ["id", "nomor_kamar", "tipeKamarId", "createdAt", "updatedAt"],
  });

  let nama_user = request.body.nama;
  let userId = await modelUser.findOne({
    where: {
      [Op.and]: [{ nama_user: { [Op.substring]: nama_user } }],
    },
  });

  let Pemesanan = {
    nomor_pemesanan: request.body.nomor_pemesanan,
    nama_pemesanan: request.body.nama_pemesanan,
    email_pemesanan: request.body.email_pemesanan,
    tgl_pemesanan: Date.now(),
    tgl_check_in: request.body.tgl_check_in,
    tgl_check_out: request.body.tgl_check_out,
    nama_tamu: request.body.nama_tamu,
    jumlah_kamar: request.body.jumlah_kamar,
    tipeKamarId: kamar.tipeKamarId,
    status_pemesanan: request.body.status_pemesanan,
    userId: userId.id,
  };

  let pemesananId = request.params.id;

  try {
    const existingPemesanan = await pemesananModel.findByPk(pemesananId);

    if (!existingPemesanan) {
      return response.json({
        success: false,
        message: ` Pemesanan dengan Id${pemesananId} tidak ditemukan`,
      });
    }
    await existingPemesanan.update(Pemesanan);
    return response.json({
      success: true,
      message: `pemesanan dengan Id${pemesananId} berhasil diupdate`,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};
// pemesananModel.update(Pemesanan, {where: {id:pemesananId}})
// .then(async (result) => {
//   await detailOfPemesananModel.destroy({
//     where: {id: pemesananId},
//   });

//   let detailsOfPemesanan = request.body.details_of_pemesanan;

//   for (let i = 0; i < detailsOfPemesanan.length; i++) {
//     detailsOfPemesanan[i].pemesananId = pemesananId;
//   }

//   let newDetail = {
//     pemesananId: pemesananId,
//     kamarId:kamar.id,
//     tgl_akses: result.tgl_check_in,
//     harga: detailsOfPemesanan[0].harga,
//   };

//   detailOfPemesananModel
//         .create(newDetail)
//         .then((result) => {
//           return response.json({
//             success: true,
//             message: `terupdate mbah`,
//           });
//         })
//         .catch((error) => {
//           return response.json({
//             success: false,
//             message: error.message,
//           });
//         });
//     })
//     .catch((error) => {
//       return response.json({
//         success: false,
//         message: error.message,
//       });
//     });

exports.deletePemesanan = async (request, response) => {
  let pemesananId = request.params.id;
  detailOfPemesananModel
    .destroy({
      where: { pemesananId: pemesananId },
    })
    .then((result) => {
      pemesananModel
        .destroy({ where: { id: pemesananId } })
        .then((result) => {
          return response.json({
            success: true,
            message: "transaksi terhapus",
          });
        })
        .catch((error) => {
          return response.json({
            success: false,
            message: error.message,
          });
        });
    })
    .catch((error) => {
      return response.json({
        success: false,
        message: error.message,
      });
    });
};

exports.findBookingByIdCustomer = async (req, res) => {
  try {
    const params = {
      id: req.params.id_customer,
    };

    const customerData = await modelUser.findOne({
      where: params,
    });
    if (customerData == null) {
      return res.status(404).json({
        message: "Data not found!",
      });
    }

    // const result = await pemesananModel.findAll({
    //     where: params,
    //     // include: ["tipe_kamarModel"],
    // })
    // return res.status(200).json({
    //   message: "Succes to get all booking by id customer",
    //     count: result.length,
    //     data: result,
    //     customerData: customerData
    // });

    const pemesanans = await pemesananModel.findAll({
      
      where: {
        [Op.and]: [{ userId: { [Op.substring]: params.id } }],
      },
      include: [
        {
          model: tipe_kamarModel,
          // attributes: ['nama_tipe_kamar', 'harga'],
        },
        // {
        //   model: detailOfPemesananModel,
        //   as: "detail_pemesanan",
        //   attributes: ["id", "harga", "pemesananId"],
        //   required: true
        // },
      ],
    });
    console.log(pemesanans)

    if (pemesanans.length === 0) {
      return res.status(404).json({
        success: true,
        data: [],
        params: params,
        message: `Data tidak ditemukan`,
      });
    }
    return res.status(200).json({
      success: true,
      data: pemesanans,
      message: `semua data sukses ditampilkan sesuai yang anda minta tuan`,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal error",
      err: err,
    });
  }
};

exports.updateStatusBooking = async (req, res) => {
  try {
    const params = { id: req.params.id };

    const result = await pemesananModel.findOne({ where: params });
    if (!result) {
      return res.status(404).json({
        message: "Data not found!",
      });
    }

    const data = {
      status_pemesanan: req.body.status_pemesanan,
    };

    if (data.status_pemesanan === "check_out") {
      await pemesananModel.update(data, { where: params });

      const updateTglAccess = {
        tgl_akses: "0000-00-00",
      };
      await detailOfPemesananModel.update(updateTglAccess, {
        where: {
          [Op.and]: [{ pemesananId: params.id }],
        },
      });
      return res.status(200).json({
        message: "Success update status booking to check out",
        code: 200,
      });
    }

    await pemesananModel.update(data, { where: params });
    return res.status(200).json({
      message: "Success update status booking",
      code: 200,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal error",
      err: err,
    });
  }
};

exports.findBookingDataFilter = async (req, res) => {
  try {
    const params = {
      id: req.params.id_customer,
    };
    const keyword = req.body.keyword;
    // const checkInDate = new Date(req.body.tgl_check_in);
    // const checkOutDate = new Date(req.body.tgl_check_out);

    const result = await pemesananModel.findAll({
      // include: ["user", "tipe_kamar", "customer"],
      where: {
        [Op.or]: [
          { status_pemesanan: { [Op.substring]: keyword } },
          { nama_tamu: { [Op.substring]: keyword } },
          { nomor_pemesanan: { [Op.substring]: keyword } },
        ],

        // no_pemesnanan: { [Op.like]: `%${keyword}%` },
        // nama_pemesanan: { [Op.like]: `%${keyword}%` },
        // email: { [Op.like]: `%${keyword}%` },
        // nama_tamu: { [Op.like]: `%${keyword}%` },
        // status_pemesanan: { [Op.like]: `%${keyword}%` },
        // tgl_check_in: {
        //     [Op.between]: [checkInDate, checkOutDate],
        // },

        [Op.and]: [{ userId: { [Op.substring]: params.id } }],
      },

      include: [
        {
          model: tipe_kamarModel,
          // attributes: ['nama_tipe_kamar', 'harga'],
        },
        // {
        //   model: detailOfPemesananModel,
        //   as: "detail_pemesanan",
        //   attributes: ["id", "harga"],
        // },
      ],
    });
    return res.status(200).json({
      message: "Succes to get all booking by filter",
      count: result.length,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal error",
      err: err,
    });
  }
};

// const { request, response } = require("express")
// const detailOfPemesananModel = require(`../models/index`).detail_pemesanan
// const pemesananModel = require(`../models/index`).pemesanan
// const modelUser = require(`../models/index`).user
// const kamarModel = require(`../models/index`).kamar
// const tipeKamarModel = require(`../models/index`).tipe_kamar

// const Op = require(`sequelize`).Op
// const Sequelize = require("sequelize");
// const sequelize = new Sequelize("hotel_new", "root", "", {
//   host: "localhost",
//   dialect: "mysql",
// });

// exports.getAllPemesanan = async (request, response) => {
//     let pemesanans = await pemesananModel.findAll()
//     return response.json({
//       success: true,
//       data: pemesanans,
//       message: `semua data sukses ditampilkan sesuai yang anda minta tuan`
//     })

// }

// // exports.getPemesanan = async (request, response) => {

// //   let check = await sequelize.query(

// //     `SELECT pemesanans.nama_pemesanan, tipe_kamars.nama_tipe_kamar, kamars.nomor_kamar
// //     FROM tipe_kamars
// //     JOIN pemesanans ON pemesanans.tipeKamarId = tipe_kamars.id
// //     JOIN kamars ON kamars.tipeKamarId = tipe_kamars.id
// //     GROUP BY pemesanans.nama_pemesanan, tipe_kamars.nama_tipe_kamar, kamars.nomor_kamar;`
// //   );
// //   console.log(check[0]);
// //   try {
// //     return response.json({
// //       success: true,
// //       data: check[0],
// //       message: `semua data sukses ditampilkan `

// //     })

// //   } catch {
// //     response.send("err")
// //   }
// // }

// // nama pemesanan
// // nama tipe kamar
// // nomer kamar

// exports.findPemesanan = async (request, response) => {
//   let status = request.body.status;
//   let pemesanans = await pemesananModel.findAll({
//     where: {
//       [Op.or]: [
//         { status: { [Op.substring]: status } },
//       ],
//     },
//   });
//   return response.json({
//     success: true,
//     data: pemesanans,
//     message: "All rooms have been loaded",
//   });
// }

// exports.addPemesanan = async (request, response) => {
//   let nomor_kamar = request.body.nomor_kamar;
//   let kamar = await kamarModel.findOne({
//     where: {
//       [Op.and]: [{ nomor_kamar: { [Op.substring]: nomor_kamar } }],
//     },
//     attributes: [
//       "id",
//       "nomor_kamar",
//       // "tipeKamarId",
//       "createdAt",
//       "updatedAt",
//     ],
//   });

//   // let nama_user = request.body.nama_user;
//   let nama_pemesanan= request.body.nama_pemesan;

//   let userId = await modelUser.findOne({
//     where: {
//       [Op.and]: [{ nama_user: { [Op.substring]: nama_pemesanan } }],
//     },
//   });

//   if (kamar === null) {
//     return response.json({
//       success: false,
//       message: `Kamar yang anda inputkan tidak ada`,
//     });
//   } else if (userId === null) {
//     return response.json({
//       success: false,
//       message: `User yang anda inputkan tidak ada`,
//     });
//   } else {
//     let newPemesanan = {
//       nomor_pemesanan: request.body.nomor_pemesanan,
//       // nama_pemesanan: request.body.nama_pemesan,
//       email_pemesanan: request.body.email_pemesan,
//       tgl_pemesanan: request.body.tgl_pemesanan,
//       tgl_check_in: request.body.tgl_check_in,
//       tgl_check_out: request.body.tgl_check_out,
//       nama_tamu: request.body.nama_tamu,
//       jumlah_kamar: request.body.jumlah_kamar,
//       tipeKamarId: kamar.id,
//       status_pemesanan: request.body.status_pemesanan,
//       userId: userId.id,

//     };

//     let kamarCheck = await sequelize.query(
//       `SELECT * FROM detail_pemesanans WHERE kamarId = ${kamar.id} AND tgl_akses= ${request.body.tgl_check_in}`
//     );
//     if (kamarCheck[0].length === 0) {
//       pemesananModel
//         .create(newPemesanan)
//         .then((result) => {
//           let pemesananID = result.id;
//           let detailsOfPemesanan = request.body.details_of_pemesanan;

//           for (let i = 0; i < detailsOfPemesanan.length; i++) {
//             detailsOfPemesanan[i].pemesananId = pemesananID;
//           }

//           let newDetail = {
//             pemesananId: pemesananID,
//             kamarId: kamar.id,
//             tgl_akses: result.tgl_check_in,
//             harga: detailsOfPemesanan[0].harga,
//           };

//           detailOfPemesananModel
//             .create(newDetail)
//             .then((result) => {
//               return response.json({
//                 success: true,
//                 message: `New transaction has been inserted`,
//               });
//             })
//             .catch((error) => {
//               return response.json({
//                 success: false,
//                 message: error.message,
//               });
//             });
//         })
//         .catch((error) => {
//           return response.json({
//             success: false,
//             message: error.message,
//           });
//         });
//     } else {
//       return response.json({
//         success: false,
//         message: `Kamar yang anda pesan sudah di booking`,
//       });
//     }
//   }
// };

// exports.updatePemesanan = async (request, response) => {
//   let nomor_kamar = request.body.nomor_kamar;
//   let kamar = await kamarModel.findOne({
//     where: {
//       [Op.and]: [{ nomor_kamar: { [Op.substring]: nomor_kamar } }],
//     },
//     attributes: [
//       "id",
//       "nomor_kamar",
//       "tipeKamarId",
//       "createdAt",
//       "updatedAt",
//     ],
//   });

//   let nama_user = request.body.nama_user;
//   let userId = await modelUser.findOne({
//     where: {
//       [Op.and]: [{ nama_user: { [Op.substring]: nama_user } }],
//     },
//   });

//   let Pemesanan = {
//     nomor_pemesanan: request.body.nomor_pemesanan,
//     nama_pemesanan: request.body.nama_pemesan,
//     email_pemesanan: request.body.email_pemesan,
//     tgl_pemesanan: request.body.tgl_pemesanan,
//     tgl_check_in: request.body.tgl_check_in,
//     tgl_check_out: request.body.tgl_check_out,
//     nama_tamu: request.body.nama_tamu,
//     jumlah_kamar: request.body.jumlah_kamar,
//     tipeKamarId: kamar.tipeKamarId,
//     status_pemesanan: request.body.status_pemesanan,
//     userId: userId.id,
//   };

//   let pemesananId = request.params.id;

//   pemesananModel.update(Pemesanan, { where: { id: pemesananId } })
//     .then(async (result) => {
//       await detailOfPemesananModel.destroy({
//         where: { id: pemesananId },
//       });

//       let detailsOfPemesanan = request.body.details_of_pemesanan;

//       for (let i = 0; i < detailsOfPemesanan.length; i++) {
//         detailsOfPemesanan[i].pemesananId = pemesananId;
//       }

//       let newDetail = {
//         pemesananId: pemesananId,
//         kamarId: kamar.id,
//         tgl_akses: result.tgl_check_in,
//         harga: detailsOfPemesanan[0].harga,
//       };

//       detailOfPemesananModel
//         .create(newDetail)
//         .then((result) => {
//           return response.json({
//             success: true,
//             message: `terupdate mbah`,
//           });
//         })
//         .catch((error) => {
//           return response.json({
//             success: false,
//             message: error.message,
//           });
//         });
//     })
//     .catch((error) => {
//       return response.json({
//         success: false,
//         message: error.message,
//       });
//     });
// }

// exports.deletePemesanan = async (request, response) => {
//   let pemesananId = request.params.id
//   detailOfPemesananModel
//   .destroy({
//     where: {id:pemesananId},
//   })
//   .then((result) => {
//     pemesananModel.destroy({where: {id:pemesananId}})
//     .then((result)=> {
//       return response.json({
//         success: true,
//         message: 'terhapus semua kenangan'
//       });
//     })
//   .catch((error)=>{
//     return response.json({
//       success:false,
//       message:error.message,
//     });
//   });
// })
// .catch((error) => {
// return response.json({
//   success: false,
//   message: error.message,
// });
// });
// };
