// methodModel.js

const config = require('../config')
const { Sequelize, Model, DataTypes, Deferrable } = require('sequelize')
const sequelize = new Sequelize(config.pgConnectionString)
const User = require('./userModel').User

class Method extends Model {}
Method.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
      deferrable: Deferrable.INITIALLY_IMMEDIATE
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { sequelize, modelName: 'method' })

Method.sync()

module.exports = function () {
  return Method
}
