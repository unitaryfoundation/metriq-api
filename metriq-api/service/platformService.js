// platformService.js

// Data Access Layer
const ModelService = require('./modelService')

// Database Model
const db = require('../models/index')
const Platform = db.platform
const sequelize = db.sequelize

// Service dependencies
const SubmissionSqlService = require('./submissionSqlService')
const submissionSqlService = new SubmissionSqlService()
const SubmissionPlatformRefService = require('./submissionPlatformRefService')
const submissionPlatformRefService = new SubmissionPlatformRefService()
const SubmissionDataSetRefService = require('./submissionDataSetRefService')
const submissionDataSetRefService = new SubmissionDataSetRefService()
const ResultService = require('./resultService')
const resultService = new ResultService()
const PlatformSubscriptionService = require('./platformSubscriptionService')
const platformSubscriptionService = new PlatformSubscriptionService()
const UserService = require('./userService')
const userService = new UserService()
const ArchitectureService = require('./architectureService')
const architectureService = new ArchitectureService()
const ProviderService = require('./providerService')
const providerService = new ProviderService()

class PlatformService extends ModelService {
  constructor () {
    super(Platform)
  }

  async getResultCount (platformId) {
    return (await sequelize.query(
      'SELECT COUNT(*) FROM "resultPlatformRefs" ' +
      '  RIGHT JOIN platforms on platforms.id = "resultPlatformRefs"."platformId" AND ("resultPlatformRefs"."deletedAt" IS NULL) ' +
      '  WHERE platforms.id = :platformId',
      { replacements: { platformId } }
    ))[0][0].count
  }

  async getSubmissionCount (platformId) {
    return (await sequelize.query(
      'SELECT COUNT(*) FROM submissions' +
      '  RIGHT JOIN "submissionTaskRefs" on submissions.id = "submissionTaskRefs"."submissionId" ' +
      '  RIGHT JOIN results on results."submissionTaskRefId" = "submissionTaskRefs".id AND (results."deletedAt" IS NULL) ' +
      '  RIGHT JOIN "resultPlatformRefs" on "resultPlatformRefs"."resultId" = results.id AND ("resultPlatformRefs"."deletedAt" IS NULL) ' +
      '  RIGHT JOIN platforms on platforms.id = "resultPlatformRefs"."platformId" ' +
      '  WHERE platforms.id = :platformId',
      { replacements: { platformId } }
    ))[0][0].count
  }

  async getLikeCount (platformId) {
    return (await sequelize.query(
      'SELECT COUNT(*) FROM likes ' +
      '  RIGHT JOIN submissions on likes."submissionId" = submissions.id ' +
      '  RIGHT JOIN "submissionTaskRefs" on submissions.id = "submissionTaskRefs"."submissionId" ' +
      '  RIGHT JOIN results on results."submissionTaskRefId" = "submissionTaskRefs".id AND (results."deletedAt" IS NULL) ' +
      '  RIGHT JOIN "resultPlatformRefs" on "resultPlatformRefs"."resultId" = results.id AND ("resultPlatformRefs"."deletedAt" IS NULL) ' +
      '  RIGHT JOIN platforms on platforms.id = "resultPlatformRefs"."platformId" ' +
      '  WHERE platforms.id = :platformId',
      { replacements: { platformId } }
    ))[0][0].count
  }

  async getPropertiesByPk (platformId) {
    return (await sequelize.query(
      'SELECT "platformDataTypeValues".id as id, "platformDataTypes".id as "typeId", "platformDataTypes".name AS name, "platformDataTypes"."dataTypeId" as "dataTypeId", "dataTypes".name AS type, "dataTypes"."friendlyName" AS "typeFriendlyName", "platformDataTypeValues".value AS value FROM platforms ' +
      '  LEFT JOIN "platformDataTypeValues" on platforms.id = "platformDataTypeValues"."platformId" ' +
      '  LEFT JOIN "platformDataTypes" on "platformDataTypes".id = "platformDataTypeValues"."platformDataTypeId" ' +
      '  LEFT JOIN "dataTypes" on "platformDataTypes"."dataTypeId" = "dataTypes".id ' +
      '  WHERE platforms.id = :platformId',
      { replacements: { platformId } }
    ))[0]
  }

  async populate (result, userId) {
    for (let i = 0; i < result.length; i++) {
      result[i].submissionCount = await this.getParentSubmissionCount(result[i].id)
      result[i].upvoteTotal = await this.getParentLikeCount(result[i].id)
      result[i].resultCount = await this.getParentResultCount(result[i].id)
    }
    const filtered = []
    for (let i = 0; i < result.length; i++) {
      if (result[i].submissionCount > 0) {
        filtered.push(result[i])
      }
    }
    if (userId) {
      for (let i = 0; i < filtered.length; i++) {
        filtered[i].isSubscribed = !!(await platformSubscriptionService.getByFks(userId, filtered[i].id))
      }
    }
    return { success: true, body: filtered }
  }

  async getTopLevelNamesAndCounts (userId, isDataSet) {
    const result = await this.getTopLevelNames(isDataSet)
    return await this.populate(result, userId)
  }

  async getTopLevelNamesAndCountsByArchitecture (architectureId, userId) {
    const result = await this.getTopLevelNamesByArchitecture(architectureId)
    return await this.populate(result, userId)
  }

  async getTopLevelNamesAndCountsByProvider (architectureId, userId) {
    const result = await this.getTopLevelNamesByProvider(architectureId)
    return await this.populate(result, userId)
  }

  async getTopLevelNames (isDataSet) {
    return (await sequelize.query(
      'SELECT id, name, description, url FROM platforms WHERE platforms."platformId" is NULL AND platforms."isDataSet" = ' + (isDataSet ? 'TRUE' : ' FALSE')
    ))[0]
  }

  async getTopLevelNamesByArchitecture (architectureId) {
    return (await sequelize.query(
      'SELECT id, name, description, url FROM platforms WHERE platforms."platformId" is NULL AND platforms."isDataSet" = FALSE AND platforms."architectureId" = ' + architectureId
    ))[0]
  }

  async getTopLevelNamesByProvider (providerId) {
    return (await sequelize.query(
      'SELECT id, name, description, url FROM platforms WHERE platforms."platformId" is NULL AND platforms."isDataSet" = FALSE AND platforms."providerId" = ' + providerId
    ))[0]
  }

  async getParentSubmissionCount (parentId) {
    return (await sequelize.query(
      'WITH RECURSIVE c AS ( ' +
      '  SELECT ' + parentId + ' as id ' +
      '  UNION ALL ' +
      '  SELECT platforms.id as id FROM platforms ' +
      '    JOIN c on c.id = platforms."platformId" ' +
      ') ' +
      'SELECT COUNT(*) FROM "submissionPlatformRefs" AS spr ' +
      '  RIGHT JOIN c on c.id = spr."platformId" AND spr."deletedAt" IS NULL AND spr.id IS NOT NULL '
    ))[0][0].count
  }

  async getParentLikeCount (parentId) {
    return (await sequelize.query(
      'WITH RECURSIVE c AS ( ' +
      '  SELECT ' + parentId + ' as id ' +
      '  UNION ALL ' +
      '  SELECT platforms.id as id FROM platforms ' +
      '    JOIN c on c.id = platforms."platformId" ' +
      ') ' +
      'SELECT COUNT(*) FROM likes ' +
      '  RIGHT JOIN submissions on likes."submissionId" = submissions.id ' +
      '  RIGHT JOIN "submissionPlatformRefs" spr on submissions.id = spr."submissionId" ' +
      '  RIGHT JOIN c on c.id = spr."platformId" AND spr."deletedAt" IS NULL AND spr.id IS NOT NULL '
    ))[0][0].count
  }

  async getParentResultCount (parentId) {
    return (await sequelize.query(
      'WITH RECURSIVE c AS ( ' +
      '  SELECT ' + parentId + ' as id ' +
      '  UNION ALL ' +
      '  SELECT platforms.id as id FROM platforms ' +
      '    JOIN c on c.id = platforms."platformId" ' +
      ') ' +
      'SELECT COUNT(*) FROM results ' +
      '  RIGHT JOIN "submissionPlatformRefs" spr on results."submissionPlatformRefId" = spr.id ' +
      '  RIGHT JOIN c on c.id = spr."platformId" AND spr.id IS NOT NULL AND results."deletedAt" IS NULL '
    ))[0][0].count
  }

  async getChildren (parentId) {
    return (await sequelize.query(
      'SELECT * FROM platforms WHERE platforms."platformId" = ' + parentId + ';'
    ))[0]
  }

  async getByName (name) {
    return await this.SequelizeServiceInstance.findOne({ name: name })
  }

  async getAllNames (userId, isDataSet) {
    const result = await this.SequelizeServiceInstance.findAndProject({ isDataSet }, ['id', 'name', 'url'])
    if (userId) {
      for (let i = 0; i < result.length; i++) {
        result[i].dataValues.isSubscribed = !!(await platformSubscriptionService.getByFks(userId, result[i].dataValues.id))
      }
    }
    return { success: true, body: result }
  }

  async submit (userId, reqBody) {
    const nameMatch = await this.getByName(reqBody.name)
    if (nameMatch) {
      return { success: false, error: 'Platform name already in use.' }
    }

    let platform = await this.SequelizeServiceInstance.new()
    platform.userId = userId
    platform.name = reqBody.name
    platform.fullName = reqBody.fullName
    platform.description = reqBody.description
    platform.platformId = reqBody.parentPlatform ? reqBody.parentPlatform : null
    platform.architectureId = reqBody.architecture
    platform.providerId = reqBody.provider
    platform.isDataSet = reqBody.isDataSet !== null ? reqBody.isDataSet : false
    platform.url = reqBody.url !== null ? reqBody.url : ''

    if (reqBody.parentPlatform) {
      const parentPlatform = await this.getByPk(platform.platformId)
      if (!parentPlatform) {
        return { success: false, error: 'Parent platform ID does not exist.' }
      }
    }

    // We need to create the model instance first, so it has a primary key, in the database.
    const createResult = await this.create(platform)
    platform = createResult.body
    await platform.save()

    const submissionsSplit = reqBody.submissions ? reqBody.submissions.split(',') : []
    for (let i = 0; i < submissionsSplit.length; i++) {
      const submissionId = submissionsSplit[i].trim()
      if (submissionId) {
        const submission = await submissionSqlService.getByPk(parseInt(submissionId))
        if (!submission) {
          return { success: false, error: 'Submission reference in Platform collection not found.' }
        }
        // Reference to submission goes in reference collection on platform.
        await submissionPlatformRefService.createOrFetch(submissionId, userId, platform.id)
      }
    }

    return await this.getSanitized(platform.id, userId)
  }

  async getSanitized (platformId, userId) {
    const platform = await this.getByPk(platformId)
    if (!platform) {
      return { success: false, error: 'Platform not found.' }
    }

    platform.dataValues.isSubscribed = ((userId > 0) && !!(await platformSubscriptionService.getByFks(userId, platformId)))

    if (platform.dataValues.architectureId) {
      platform.dataValues.architecture = await architectureService.getByPk(platform.dataValues.architectureId)
    } else {
      platform.dataValues.architecture = null
    }
    delete platform.dataValues.architectureId

    if (platform.dataValues.providerId) {
      platform.dataValues.provider = await providerService.getByPk(platform.dataValues.providerId, userId)
    } else {
      platform.dataValues.provider = null
    }
    delete platform.dataValues.providerId

    if (platform.dataValues.platformId) {
      platform.dataValues.parentPlatform = (await this.getByPk(platform.dataValues.platformId, userId)).body
    } else {
      platform.dataValues.parentPlatform = null
    }
    delete platform.dataValues.platformId

    platform.dataValues.childPlatforms = await platform.getPlatforms()

    const properties = await this.getPropertiesByPk(platformId)
    if (properties[0].name) {
      platform.dataValues.properties = properties
    } else {
      platform.dataValues.properties = []
    }

    platform.dataValues.submissions = (await submissionSqlService.getByPlatformId(platformId)).body

    return { success: true, body: platform }
  }

  async subscribe (platformId, userId) {
    let platform = await this.getByPk(platformId)
    if (!platform) {
      return { success: false, error: 'Platform not found.' }
    }

    const user = await userService.getByPk(userId)
    if (!user) {
      return { success: false, error: 'User not found.' }
    }

    let subscription = await platformSubscriptionService.getByFks(user.id, platform.id)
    if (subscription) {
      await platformSubscriptionService.deleteByPk(subscription.id)
    } else {
      subscription = await platformSubscriptionService.createOrFetch(user.id, platform.id)
    }

    platform = (await this.getSanitized(platformId, userId)).body
    return { success: true, body: platform }
  }

  async update (platformId, reqBody, userId) {
    const platform = await this.getByPk(platformId)
    if (!platform) {
      return { success: false, error: 'Platform not found.' }
    }

    if (reqBody.name !== undefined) {
      platform.name = reqBody.name.trim()
    }
    if (reqBody.fullName !== undefined) {
      platform.fullName = reqBody.fullName.trim()
    }
    if (reqBody.description !== undefined) {
      platform.description = reqBody.description.trim()
    }
    if (reqBody.parentPlatform !== undefined) {
      platform.platformId = (reqBody.parentPlatform && parseInt(reqBody.parentPlatform) !== platform.id) ? parseInt(reqBody.parentPlatform) : null
    }
    if (reqBody.provider !== undefined) {
      platform.providerId = reqBody.provider ? parseInt(reqBody.provider) : null
    }
    if (reqBody.architecture !== undefined) {
      platform.architectureId = reqBody.architecture ? parseInt(reqBody.architecture) : null
    }
    if (reqBody.url !== undefined) {
      platform.url = reqBody.url
    }

    await platform.save()

    return await this.getSanitized(platform.id, userId)
  }

  async addOrRemovePlatformSubmission (isAdd, platformId, submissionId, userId) {
    const platform = await this.getByPk(platformId)
    if (!platform) {
      return { success: false, error: 'Platform not found.' }
    }

    let submission = await submissionSqlService.getByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found.' }
    }

    if (isAdd) {
      await submissionPlatformRefService.createOrFetch(submission.id, userId, platform.id)
    } else {
      const ref = await submissionPlatformRefService.getByFks(submission.id, platform.id)
      if (ref) {
        const results = (await resultService.getByPlatformIdSubmissionId(platform.id, submission.id)).body
        if (results && results.length) {
          return { success: false, error: 'Cannot delete submission platform reference with result. Change or delete results in the submission that use this platform, first.' }
        }
        await submissionPlatformRefService.deleteByPk(ref.id)
      }
    }

    submission = await submissionSqlService.getEagerByPk(submissionId)
    submission = await submissionSqlService.populate(submission, userId)

    return { success: true, body: submission }
  }

  async addOrRemoveDataSetSubmission (isAdd, dataSetId, submissionId, userId) {
    const dataSet = await this.getByPk(dataSetId)
    if (!dataSet) {
      return { success: false, error: 'Data set not found.' }
    }

    let submission = await submissionSqlService.getByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found.' }
    }

    if (isAdd) {
      await submissionDataSetRefService.createOrFetch(submission.id, userId, dataSet.id)
    } else {
      const ref = await submissionDataSetRefService.getByFks(submission.id, dataSet.id)
      if (ref) {
        const results = (await resultService.getByDataSetIdSubmissionId(dataSet.id, submission.id)).body
        if (results && results.length) {
          return { success: false, error: 'Cannot delete submission data set reference with result. Change or delete results in the submission that use this platform, first.' }
        }
        await submissionDataSetRefService.deleteByPk(ref.id)
      }
    }

    submission = await submissionSqlService.getEagerByPk(submissionId)
    submission = await submissionSqlService.populate(submission, userId)

    return { success: true, body: submission }
  }
}

module.exports = PlatformService
