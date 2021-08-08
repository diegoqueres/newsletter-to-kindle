'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Log extends Model {
  };

  Log.init({
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Log',
  });
  
  return Log;
};