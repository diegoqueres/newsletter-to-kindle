'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscriber extends Model {
    static associate(models) {
      Subscriber.belongsToMany(models['Newsletter'], { 
        through: 'Subscriptions',
        as: 'subscriptions',
        foreignKey: "subscriptionId",  
      });
    }
  };
  Subscriber.init({
    email: DataTypes.STRING,
    kindleEmail: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Subscriber',
  });

  return Subscriber;
};
