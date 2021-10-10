'use strict';
const {Model} = require('sequelize');
const PROTECTED_ATTRIBUTES = ['password', 'salt', 'confirmCode'];

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models['Newsletter']);
    }

    toJSON () {
      // hide protected fields
      let attributes = Object.assign({}, this.get());
      for (let a of PROTECTED_ATTRIBUTES) {
        delete attributes[a];
      }
      return attributes;
    }
  };

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    salt: DataTypes.STRING,
    confirmCode: DataTypes.SMALLINT,
    super: { type: DataTypes.BOOLEAN, defaultValue: false },
    pendingConfirm: { type: DataTypes.BOOLEAN, defaultValue: false },
    pendingPassword: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};