'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Log extends Model {
  };

  Log.init({
    level: DataTypes.STRING(15),
    message: DataTypes.STRING(1024),
    meta: DataTypes.STRING,
    timestamp: DataTypes.DATE 
  }, {
    sequelize,
    timestamps: false,
    modelName: 'Log',
  });
  
  return Log;
};