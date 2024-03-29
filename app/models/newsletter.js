'use strict';
const ValidationUtils = require('../utils/validation-utils');
const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Newsletter extends Model {
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
        default:
          return 'UTF-8';
      }
    }

    getLanguage() {
      return this.getCurrentLocale().substring(0,2);
    }

    getCurrentLocale() {
      return this.translationTarget || this.locale;
    }

    mustBeTranslated() {
      return ValidationUtils.validNonEmptyString(this.translationTarget); 
    }

    mustBeScrapped() {
      return this.partial; 
    }

    getDaysOfWeek() {
      return this.dayOfWeek != null ? this.dayOfWeek.split(',').map((day) => parseInt(day)) : [];
    }

    static associate(models) {
      Newsletter.belongsTo(models['User'], { foreignKey: 'userId' });

      Newsletter.belongsToMany(models['Subscriber'], { 
        through: 'Subscriptions',
        as: 'subscribers',
        foreignKey: "newsletterId",  
      });
    }
  };

  Newsletter.init({
    name: DataTypes.STRING,
    website: DataTypes.STRING,
    feedUrl: DataTypes.STRING,
    author: DataTypes.STRING,
    partial: DataTypes.BOOLEAN,
    subject: DataTypes.STRING,
    locale: DataTypes.STRING,
    articleSelector: DataTypes.STRING,
    maxPosts: DataTypes.INTEGER,
    updatePeriodicity: DataTypes.INTEGER,
    dayOfWeek: DataTypes.STRING,
    translationTarget: DataTypes.STRING,
    translationMode: DataTypes.INTEGER,
    includeImgs: DataTypes.BOOLEAN,
    useReadable: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Newsletter',
  });

  return Newsletter;
};