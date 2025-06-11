// resultModel.js

'use strict'
module.exports = function (sequelize, DataTypes) {
  const Model = sequelize.define('result', {
    isHigherBetter: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    metricName: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metricValue: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    evaluatedAt: {
      type: DataTypes.DATE
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    standardError: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    sampleSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    qubitCount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    circuitDepth: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    shots: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    min_value: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    max_value: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    q1_value: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    median_value: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    q3_value: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {})
  Model.associate = function (db) {
    db.user.hasMany(db.result)
  }
  return Model
}
