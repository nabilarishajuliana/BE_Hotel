'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class kamar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.tipe_kamar)
      this.hasMany(models.detail_pemesanan, {
        foreignKey: 'id', as: "detail_pemesanan"
      })
      // define association here
    }
  }
  kamar.init({
    nomor_kamar: DataTypes.INTEGER,
    tipeKamarId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'kamar',
  });
  return kamar;
};

