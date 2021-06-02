'use strict';
const ValidationUtils = require('../utils/validation-utils');
const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Feed extends Model {
    static PERIODICITY = {
      LAST: 1,
      DAILY: 2,
      WEEKLY: 3
    }
    static DAY_OF_WEEK = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6
    }

    getEncoding() {
      switch(this.locale.toLowerCase()) {
        case 'pt-br':
        case 'en-us':
          return 'Windows-1252';
        default:
          return 'UTF-8';
      }
    }

    mustBeTranslated() {
      return ValidationUtils.validNonEmptyString(this.translationTarget); 
    }

    mustBeScrapped() {
      return this.partial; 
    }

    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };

  Feed.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    author: DataTypes.STRING,
    partial: DataTypes.BOOLEAN,
    subject: DataTypes.STRING,
    locale: DataTypes.STRING,
    articleSelector: DataTypes.STRING,
    maxPosts: DataTypes.INTEGER,
    updatePeriodicity: DataTypes.INTEGER,
    dayOfWeek: DataTypes.INTEGER,
    translationTarget: DataTypes.STRING,
    translationMode: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Feed'
  });

  return Feed;
};