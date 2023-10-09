const userModel = require(`../models/index`).user
// const { request, response } = require("express")

const Op = require(`sequelize`).Op
const md5 = require('md5')


/** load library 'path' and 'filestream' */ 
const path = require(`path`)
const fs = require(`fs`)



const upload = require(`./upload-cover`).single(`foto`)
const jsonwebtoken = require("jsonwebtoken")
const SECRET_KEY = "secretcode"




exports.login = async (request, response) => {
  try{
      const params = {
          email: request.body.email,
          password: md5(request.body.password),
      };
      
      const findUser = await userModel.findOne({where:params});
      if (findUser == null){
          return response.status(404).json({
              message: "email or password doesn't match",
              err: error,
          });
      }
      console.log(findUser)
      let tokenPayload = {
          id_user: findUser.id,
          email: findUser.email,
          role: findUser.role,
          nama_user: findUser.nama_user
      };
      
      tokenPayload = JSON.stringify(tokenPayload);
      let token =  jsonwebtoken.sign(tokenPayload, SECRET_KEY);
      
      return response.status(200).json({
          message: "success login",
          data: {
              token: token,
              id_user: findUser.id,
              email: findUser.email,
              role: findUser.role,
              nama_user: findUser.nama_user,
              foto: findUser.foto

          },
      });
  }
  catch(err){
      return response.status(500).json({
          message: "internal error " + err,
          
      });
      
  }
};


exports.getAllUser = async (request, response) => {
    let users = await userModel.findAll() /** call findAll() to get all data */
    return response.json({
        success: true,
        data: users,
        message: `All user have been loaded`
    })
}

exports.findUser = async (request, response) => {
    let nama_user = request.body.keyword
    // let email = request.body.email
    // let password = md5(request.body.password)

    let users = await userModel.findAll({ 
        where: {
        [Op.or]: [
            { nama_user: { [Op.substring]: nama_user } },
            // { email: { [Op.substring]: email } },
            // { password: { [Op.substring]: password } }
        ]
        }
    })
    return response.json({ 
        success: true, 
        data: users,
        message: `All User have been loaded`
        }) 

}

exports.addUser = (request, response) => {
    /** run function upload */
    upload(request, response, async (error) => {
      /** check if there are errorwhen upload */
      if (error) {
        console.log("err");
        return response.json({ message: error });
      }
      /** check if file is empty */
      if (!request.file) {
        return response.json({ message: `Nothing file to Upload` });
      }
      /** prepare data from request */
      let newUser = {
        nama_user: request.body.nama_user,
        foto: request.file.filename,
        email: request.body.email,
        password: md5(request.body.password),
        role: request.body.role,
      };
      console.log(newUser);
      userModel
        .create(newUser)
        .then((result) => {
          return response.json({
            success: true,
            data: result,
            message: `New user has been inserted`,
          });
        })
        .catch((error) => {
          return response.json({
            success: false,
            message: error.message,
          });
        });
    });
  };

exports.updateUser = (request, response) => {

  upload(request, response, async (error) => {
    /** check if there are errorwhen upload */
    if (error) {
      console.log("err");
      return response.json({ message: error });
    }
    /** check if file is empty */
    if (!request.file) {
      return response.json({ message: `Nothing file to Upload` });
    }

/** define id member that will be update */
    let idUser = request.params.id

    /** prepare data that has been changed */
    let dataUser = {
      nama_user: request.body.nama_user,
      // foto: request.file.filename,
      email: request.body.email,
      // password: md5(request.body.password),
      role: request.body.role,
    }

    if (request.body.password) {
      // Jika ada perubahan pada password, enkripsi password baru
      dataUser.password = md5(request.body.password);
    }

    if (request.file && request.file.filename) {
      dataUser.foto = request.file.filename;
    }
    if (request.file) {
      const selectedUser = await userModel.findOne({
        where: { id: idUser },
      });

      const oldFotoUser = selectedUser.foto;

      const patchFoto = path.join(__dirname, `../foto`, oldFotoUser);

      if (fs.existsSync(patchFoto)) {
        fs.unlink(patchFoto, (error) => console.log(error));
      }
      dataUser.foto = request.file.filename;
    }

    /** execute update data based on defined id member */
    userModel.update(dataUser, { where: { id: idUser } })
        .then(result => {
            /** if update's process success */
            return response.json({
                success: true,
                message: `Data user has been updated`
            })
        })
        .catch(error => {
            /** if update's process fail */
            return response.json({
                success: false,
                message: error.message
            })
        })
      });
}

/** create function for delete data */
exports.deleteUser = (request, response) => {
    /** define id member that will be update */
    let idUser = request.params.id

    /** execute delete data based on defined id member */
    userModel.destroy({ where: { id: idUser } })
        .then(result => {
            /** if update's process success */
            return response.json({
                success: true,
                message: `Data user has been updated`
            })
        })
        .catch(error => {
            /** if update's process fail */
            return response.json({
                success: false,
                message: error.message
            })
        })
}
