'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('results', 'min_value',
          {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          { transaction: t }
        ),
        queryInterface.addColumn('results', 'max_value',
          {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          { transaction: t }
        ),
        queryInterface.addColumn('results', 'q1_value',
          {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          { transaction: t }
        ),
        queryInterface.addColumn('results', 'median_value',
          {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          { transaction: t }
        ),
        queryInterface.addColumn('results', 'q3_value',
          {
            type: Sequelize.FLOAT,
            allowNull: true
          },
          { transaction: t }
        )
      ])
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('results', 'q3_value', { transaction: t }),
        queryInterface.removeColumn('results', 'median_value', { transaction: t }),
        queryInterface.removeColumn('results', 'q1_value', { transaction: t }),
        queryInterface.removeColumn('results', 'max_value', { transaction: t }),
        queryInterface.removeColumn('results', 'min_value', { transaction: t })
      ])
    })
  }
}