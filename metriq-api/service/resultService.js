// resultService.js

// Data Access Layer
const ModelService = require('./modelService')
// Database Model
const db = require('../models/index')
const sequelize = db.sequelize
const Result = db.result

// Service dependencies
const SubmissionSqlService = require('../service/submissionSqlService')
const submissionSqlService = new SubmissionSqlService()
const SubmissionTaskRefService = require('./submissionTaskRefService')
const submissionTaskRefService = new SubmissionTaskRefService()
const SubmissionMethodRefService = require('./submissionMethodRefService')
const submissionMethodRefService = new SubmissionMethodRefService()
const SubmissionDataSetRefService = require('./submissionDataSetRefService')
const submissionDataSetRefService = new SubmissionDataSetRefService()
const SubmissionPlatformRefService = require('./submissionPlatformRefService')
const submissionPlatformRefService = new SubmissionPlatformRefService()

class ResultService extends ModelService {
  constructor () {
    super(Result)
  }

  sqlByTask (taskId) {
    return 'WITH RECURSIVE c AS ( ' +
    '    SELECT ' + taskId + ' as id ' +
    '    UNION ALL ' +
    '    SELECT t.id FROM tasks AS t ' +
    '    JOIN c on c.id = t."taskId" ' +
    ') ' +
    'SELECT r.*, s.name AS "submissionName", pr.name AS "providerName", s."contentUrl" AS "submissionUrl", s.id AS "submissionId", CASE WHEN t.id = ' + taskId + ' THEN m.name ELSE m.name || \' | \' || t.name END AS "methodName", COALESCE(d.name, \'\') as "dataSetName", COALESCE(p.name, \'\') as "platformName" FROM "submissionTaskRefs" AS str ' +
    '    RIGHT JOIN c on c.id = str."taskId" ' +
    '    JOIN results AS r on r."submissionTaskRefId" = str.id AND r."deletedAt" IS NULL ' +
    '    LEFT JOIN submissions AS s on str."submissionId" = s.id AND s."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionMethodRefs" AS smr on r."submissionMethodRefId" = smr.id AND smr."deletedAt" IS NULL ' +
    '    LEFT JOIN methods AS m on smr."methodId" = m.id ' +
    '    LEFT JOIN "submissionPlatformRefs" AS spr on r."submissionPlatformRefId" = spr.id AND spr."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionPlatformRefs" AS sdr on r."submissionDataSetRefId" = sdr.id AND sdr."deletedAt" IS NULL ' +
    '    LEFT JOIN platforms AS p on spr."platformId" = p.id ' +
    '    LEFT JOIN platforms AS d on sdr."platformId" = d.id ' +
    '    LEFT JOIN providers AS pr on p."providerId" = pr.id ' +
    '    LEFT JOIN tasks AS t on str."taskId" = t.id ' +
    '    WHERE str."deletedAt" IS NULL;'
  }

  sqlByTaskSubmission (taskId, submissionId) {
    return 'WITH RECURSIVE c AS ( ' +
    '    SELECT ' + taskId + ' as id ' +
    '    UNION ALL ' +
    '    SELECT t.id FROM tasks AS t ' +
    '    JOIN c on c.id = t."taskId" ' +
    ') ' +
    'SELECT r.*, s.name AS "submissionName", s.id as "submissionId", CASE WHEN t.id = ' + taskId + ' THEN m.name ELSE m.name || \' | \' || t.name END AS "methodName", COALESCE(d.name, \'\') as "dataSetName", COALESCE(p.name, \'\') as "platformName" FROM "submissionTaskRefs" AS str ' +
    '    RIGHT JOIN c on c.id = str."taskId" ' +
    '    JOIN results AS r on r."submissionTaskRefId" = str.id AND r."deletedAt" IS NULL ' +
    '    LEFT JOIN submissions AS s on str."submissionId" = s.id AND s."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionMethodRefs" AS smr on r."submissionMethodRefId" = smr.id AND smr."deletedAt" IS NULL ' +
    '    LEFT JOIN methods AS m on smr."methodId" = m.id ' +
    '    LEFT JOIN "submissionPlatformRefs" AS spr on r."submissionPlatformRefId" = spr.id AND spr."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionPlatformRefs" AS sdr on r."submissionDataSetRefId" = sdr.id AND sdr."deletedAt" IS NULL ' +
    '    LEFT JOIN platforms AS p on spr."platformId" = p.id ' +
    '    LEFT JOIN platforms AS d on sdr."platformId" = d.id ' +
    '    LEFT JOIN tasks AS t on str."taskId" = t.id ' +
    '    WHERE str."deletedAt" IS NULL AND s.id = ' + submissionId + ';'
  }

  sqlBySubmission() {
    return 'SELECT r.*, p.name AS device, pr.name AS provider, p.id AS "platformId", t.name AS "taskName"'  +
      ' FROM "submissionTaskRefs" AS str' +
      ' JOIN results AS r on r."submissionTaskRefId" = str.id AND r."deletedAt" IS NULL' +
      ' LEFT JOIN "submissionPlatformRefs" AS spr on r."submissionPlatformRefId" = spr.id AND spr."deletedAt" IS NULL' +
      ' LEFT JOIN platforms AS p on spr."platformId" = p.id' +
      ' LEFT JOIN providers AS pr on p."providerId" = pr.id' +
      ' LEFT JOIN tasks AS t on str."taskId" = t.id' +
      ' LEFT JOIN submissions AS s on str."submissionId" = s.id AND s."deletedAt" IS NULL' +
      ' WHERE str."deletedAt" IS NULL AND s.id = ?;'
  }

  sqlByMethodSubmission (methodId, submissionId) {
    return 'WITH RECURSIVE c AS ( ' +
    '    SELECT ' + methodId + ' as id ' +
    '    UNION ALL ' +
    '    SELECT t.id FROM methods AS t ' +
    '    JOIN c on c.id = t."methodId" ' +
    ') ' +
    'SELECT r.*, s.name AS "submissionName", s.id AS "submissionId", COALESCE(d.name, \'\') as "dataSetName", COALESCE(p.name, \'\') as "platformName"  FROM "submissionMethodRefs" AS smr ' +
    '    RIGHT JOIN c on c.id = smr."methodId" ' +
    '    JOIN results AS r on r."submissionMethodRefId" = smr.id AND r."deletedAt" IS NULL ' +
    '    LEFT JOIN submissions AS s on smr."submissionId" = s.id AND s."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionTaskRefs" AS str on r."submissionTaskRefId" = str.id AND str."deletedAt" IS NULL ' +
    '    LEFT JOIN methods AS m on smr."methodId" = m.id ' +
    '    LEFT JOIN "submissionPlatformRefs" AS spr on r."submissionPlatformRefId" = spr.id AND spr."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionPlatformRefs" AS sdr on r."submissionDataSetRefId" = sdr.id AND sdr."deletedAt" IS NULL ' +
    '    LEFT JOIN platforms AS p on spr."platformId" = p.id ' +
    '    LEFT JOIN platforms AS d on sdr."platformId" = d.id ' +
    '    LEFT JOIN tasks AS t on str."taskId" = t.id ' +
    '    WHERE str."deletedAt" IS NULL AND s.id=' + submissionId + ';'
  }

  sqlByPlatformSubmission (platformId, submissionId) {
    return 'WITH RECURSIVE c AS ( ' +
    '    SELECT ' + platformId + ' as id ' +
    '    UNION ALL ' +
    '    SELECT t.id FROM platforms AS t ' +
    '    JOIN c on c.id = t."platformId" ' +
    ') ' +
    'SELECT r.*, s.name AS "submissionName", s.id as "submissionId", COALESCE(d.name, \'\') as "dataSetName", COALESCE(p.name, \'\') as "platformName"  FROM "submissionPlatformRefs" AS spr ' +
    '    RIGHT JOIN c on c.id = spr."platformId" ' +
    '    JOIN results AS r on r."submissionPlatformRefId" = spr.id AND r."deletedAt" IS NULL ' +
    '    LEFT JOIN submissions AS s on spr."submissionId" = s.id AND s."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionMethodRefs" AS smr on r."submissionMethodRefId" = smr.id AND smr."deletedAt" IS NULL ' +
    '    LEFT JOIN methods AS m on smr."methodId" = m.id ' +
    '    LEFT JOIN "submissionTaskRefs" AS str on r."submissionTaskRefId" = spr.id AND str."deletedAt" IS NULL ' +
    '    LEFT JOIN tasks AS t on str."taskId" = t.id ' +
    '    LEFT JOIN platforms AS p on spr."platformId" = p.id ' +
    '    LEFT JOIN platforms AS d on sdr."platformId" = d.id ' +
    '    WHERE str."deletedAt" IS NULL AND s.id = ' + submissionId + ';'
  }

  sqlByDataSetSubmission (dataSetId, submissionId) {
    return 'WITH RECURSIVE c AS ( ' +
    '    SELECT ' + dataSetId + ' as id ' +
    '    UNION ALL ' +
    '    SELECT t.id FROM platforms AS t ' +
    '    JOIN c on c.id = t."dataSetId" ' +
    ') ' +
    'SELECT r.*, s.name AS "submissionName", s.id as "submissionId", COALESCE(d.name, \'\') as "dataSetName", COALESCE(p.name, \'\') as "platformName"  FROM "submissionPlatformRefs" AS spr ' +
    '    RIGHT JOIN c on c.id = spr."dataSetId" ' +
    '    JOIN results AS r on r."submissionDataSetRefId" = spr.id AND r."deletedAt" IS NULL ' +
    '    LEFT JOIN submissions AS s on spr."submissionId" = s.id AND s."deletedAt" IS NULL ' +
    '    LEFT JOIN "submissionMethodRefs" AS smr on r."submissionMethodRefId" = smr.id AND smr."deletedAt" IS NULL ' +
    '    LEFT JOIN methods AS m on smr."methodId" = m.id ' +
    '    LEFT JOIN "submissionTaskRefs" AS str on r."submissionTaskRefId" = spr.id AND str."deletedAt" IS NULL ' +
    '    LEFT JOIN tasks AS t on str."taskId" = t.id ' +
    '    LEFT JOIN platforms AS p on spr."platformId" = p.id ' +
    '    LEFT JOIN platforms AS d on sdr."platformId" = d.id ' +
    '    WHERE str."deletedAt" IS NULL AND s.id = ' + submissionId + ';'
  }

  async getBySubmissionId(submissionId) {
    const result = (await sequelize.query(this.sqlBySubmission(), {
      replacements: [submissionId],
      type: sequelize.QueryTypes.SELECT
    }))
    return { success: true, body: result }
  }

  async getByTaskId (taskId) {
    const result = (await sequelize.query(this.sqlByTask(taskId)))[0]
    return { success: true, body: result }
  }

  async getByTaskIdAndSubmissionId (taskId, submissionId) {
    const result = (await sequelize.query(this.sqlByTaskSubmission(taskId, submissionId)))[0]
    return { success: true, body: result }
  }

  async getByMethodIdAndSubmissionId (methodId, submissionId) {
    const result = (await sequelize.query(this.sqlByMethodSubmission(methodId, submissionId)))[0]
    return { success: true, body: result }
  }

  async getByPlatformIdSubmissionId (platformId, submissionId) {
    const result = (await sequelize.query(this.sqlByPlatformSubmission(platformId, submissionId)))[0]
    return { success: true, body: result }
  }

  async getByDataSetIdSubmissionId (dataSetId, submissionId) {
    const result = (await sequelize.query(this.sqlByDataSetSubmission(dataSetId, submissionId)))[0]
    return { success: true, body: result }
  }

  async listMetricNames () {
    const distinctResults = await this.SequelizeServiceInstance.distinctAll('"metricName"')
    const body = []
    for (let i = 0; i < distinctResults.length; i++) {
      body.push(distinctResults[i].DISTINCT)
    }
    return body
  }

  async submit (userId, submissionId, reqBody) {
    let submission = await submissionSqlService.getByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Task must be not null and valid (present in database) for a valid result object.
    if (reqBody.task === null) {
      return { success: false, error: 'Result requires task to be defined.' }
    }

    // Method must be not null and valid (present in database) for a valid result object.
    if (reqBody.method == null) {
      return { success: false, error: 'Result requires method to be defined.' }
    }

    const result = await this.SequelizeServiceInstance.new()

    // Platform must be not null and valid (present in database) for a valid result object.
    if (reqBody.platform) {
      const platform = (await submissionPlatformRefService.getByFks(submissionId, parseInt(reqBody.platform)))
      if (platform.isDataSet) {
        return { success: false, error: 'Invalid platform reference specified.' }
      }
      result.submissionPlatformRefId = platform.id
    } else {
      result.submissionPlatformRefId = null
    }

    // Data Set must be not null and valid (present in database) for a valid result object.
    if (reqBody.dataSet) {
      const dataSet = (await submissionDataSetRefService.getByFks(submissionId, parseInt(reqBody.dataSet)))
      if (!dataSet.isDataSet) {
        return { success: false, error: 'Invalid data set reference specified.' }
      }
      result.submissionDataSetRefId = platform.id
    } else {
      result.submissionDataSetRefId = null
    }

    result.userId = userId
    result.submissionId = submissionId
    result.submissionTaskRefId = (await submissionTaskRefService.getByFks(submissionId, parseInt(reqBody.task))).id
    result.submissionMethodRefId = (await submissionMethodRefService.getByFks(submissionId, parseInt(reqBody.method))).id
    result.isHigherBetter = reqBody.isHigherBetter
    result.metricName = reqBody.metricName
    result.metricValue = parseFloat(reqBody.metricValue)
    result.evaluatedAt = new Date(reqBody.evaluatedAt)
    result.notes = reqBody.notes ? reqBody.notes : ''
    result.standardError = reqBody.standardError
    result.sampleSize = reqBody.sampleSize
    result.qubitCount = reqBody.qubitCount
    result.circuitDepth = reqBody.circuitDepth
    result.shots = reqBody.shots

    if (reqBody.minValue !== undefined) {
      result.min_value = reqBody.minValue ? parseFloat(reqBody.minValue) : null
    }
    if (reqBody.maxValue !== undefined) {
      result.max_value = reqBody.maxValue ? parseFloat(reqBody.maxValue) : null
    }
    if (reqBody.q1Value !== undefined) {
      result.q1_value = reqBody.q1Value ? parseFloat(reqBody.q1Value) : null
    }
    if (reqBody.medianValue !== undefined) {
      result.median_value = reqBody.medianValue ? parseFloat(reqBody.medianValue) : null
    }
    if (reqBody.q3Value !== undefined) {
      result.q3_value = reqBody.q3Value ? parseFloat(reqBody.q3Value) : null
    }

    const nResult = await this.create(result)
    if (!nResult.success) {
      return nResult
    }

    submission = await submissionSqlService.getEagerByPk(submissionId)
    submission = await submissionSqlService.populate(submission, userId)

    return { success: true, body: submission }
  }

  async delete (resultId) {
    const result = await this.getByPk(resultId)
    if (!result) {
      return { success: false, error: 'Result not found.' }
    }

    await result.destroy()

    return { success: true, body: result }
  }

  async update (userId, resultId, reqBody) {
    const result = await this.getByPk(resultId)
    if (!result) {
      return { success: false, error: 'Result not found.' }
    }

    // Task must be not null and valid (present in database) for a valid result object.
    if (reqBody.task === null) {
      return { success: false, error: 'Result requires task to be defined.' }
    }

    // Method must be not null and valid (present in database) for a valid result object.
    if (reqBody.method === null) {
      return { success: false, error: 'Result requires method to be defined.' }
    }

    // Platform must be not null and valid (present in database) for a valid result object.
    if (reqBody.platform) {
      const platform = (await submissionPlatformRefService.getByFks(reqBody.submissionId, parseInt(reqBody.platform)))
      if (platform.isDataSet) {
        return { success: false, error: 'Invalid platform reference specified.' }
      }
      result.submissionPlatformRefId = platform.id
    } else {
      result.submissionPlatformRefId = null
    }

    // Data Set must be not null and valid (present in database) for a valid result object.
    if (reqBody.dataSet) {
      const dataSet = (await submissionPlatformRefService.getByFks(reqBody.submissionId, parseInt(reqBody.dataSet)))
      if (!dataSet.isDataSet) {
        return { success: false, error: 'Invalid dataSet reference specified.' }
      }
      result.submissionDataSetRefId = dataSet.id // fixed: was using platform.id
    } else {
      result.submissionDataSetRefId = null
    }

    result.submissionTaskRefId = (await submissionTaskRefService.getByFks(reqBody.submissionId, parseInt(reqBody.task))).id
    result.submissionMethodRefId = (await submissionMethodRefService.getByFks(reqBody.submissionId, parseInt(reqBody.method))).id
    result.isHigherBetter = reqBody.isHigherBetter
    result.metricName = reqBody.metricName
    result.metricValue = parseFloat(reqBody.metricValue)
    result.evaluatedAt = new Date(reqBody.evaluatedAt)
    result.notes = reqBody.notes ? reqBody.notes : ''
    result.standardError = reqBody.standardError
    result.sampleSize = reqBody.sampleSize
    result.qubitCount = reqBody.qubitCount
    result.circuitDepth = reqBody.circuitDepth
    result.shots = reqBody.shots

    if (reqBody.minValue !== undefined) {
      result.min_value = reqBody.minValue ? parseFloat(reqBody.minValue) : null
    }
    if (reqBody.maxValue !== undefined) {
      result.max_value = reqBody.maxValue ? parseFloat(reqBody.maxValue) : null
    }
    if (reqBody.q1Value !== undefined) {
      result.q1_value = reqBody.q1Value ? parseFloat(reqBody.q1Value) : null
    }
    if (reqBody.medianValue !== undefined) {
      result.median_value = reqBody.medianValue ? parseFloat(reqBody.medianValue) : null
    }
    if (reqBody.q3Value !== undefined) {
      result.q3_value = reqBody.q3Value ? parseFloat(reqBody.q3Value) : null
    }

    await result.save()

    let submission = await submissionSqlService.getEagerByPk(reqBody.submissionId)
    submission = await submissionSqlService.populate(submission, userId)

    return { success: true, body: submission }
  }
}

module.exports = ResultService
