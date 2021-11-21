'use strict';
const {Model} = require('sequelize');
const PROTECTED_ATTRIBUTES = ['token'];

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    toJSON () {
      let attributes = Object.assign({}, this.get());
      this.hideProtectedAttributes(attributes);
      return attributes;
    }

    hideProtectedAttributes (attributes) {
      for (let a of PROTECTED_ATTRIBUTES) {
        delete attributes[a];
      }
    }
  };

  Subscription.init({
    subscriberId: DataTypes.INTEGER,
    newsletterId: DataTypes.INTEGER,
    acceptedTerms: DataTypes.BOOLEAN,
    token: DataTypes.STRING,
    pendingConfirm: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    sequelize,
    modelName: 'Subscription',
  });
  
  return Subscription;
};