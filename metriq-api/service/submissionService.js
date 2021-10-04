// submissionService.js

const { Op } = require('sequelize')

// Data Access Layer
const SequelizeService = require('./sequelizeService')
// Database Model
const Submission = require('../model/submissionModel').Submission

// For email
const config = require('./../config')
const nodemailer = require('nodemailer')

// Service dependencies
const UserService = require('./userService')
const userService = new UserService()
const TagService = require('./tagService')
const tagService = new TagService()
const SubmissionTagRefService = require('./submissionTagRefService')
const submissionTagRefService = new SubmissionTagRefService()

// Aggregation
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(config.pgConnectionString)

class SubmissionService {
  constructor () {
    this.SequelizeServiceInstance = new SequelizeService(Submission)
  }

  sqlLike (userId, sortColumn, isDesc, limit, offset) {
    return 'SELECT submissions.*, "upvotesCount", (sl."isUpvoted" > 0) as "isUpvoted" from ' +
        '    (SELECT submissions.id as "submissionId", COUNT(likes.*) as "upvotesCount", SUM(CASE likes."userId" WHEN ' + userId + ' THEN 1 ELSE 0 END) as "isUpvoted" from likes ' +
        '    RIGHT JOIN submissions on likes."submissionId" = submissions.id ' +
        '    WHERE submissions."approvedAt" IS NOT NULL ' +
        '    GROUP BY submissions.id) as sl ' +
        'LEFT JOIN submissions on submissions.id = sl."submissionId" ' +
        'ORDER BY ' + sortColumn + (isDesc ? ' DESC ' : ' ASC ') +
        'LIMIT ' + limit + ' OFFSET ' + offset
  }

  sqlTagLike (tagId, userId, sortColumn, isDesc, limit, offset) {
    return 'SELECT submissions.*, "upvotesCount", (sl."isUpvoted" > 0) as "isUpvoted" from ' +
        '    (SELECT submissions.id as "submissionId", COUNT(likes.*) as "upvotesCount", SUM(CASE likes."userId" WHEN ' + userId + ' THEN 1 ELSE 0 END) as "isUpvoted" from likes ' +
        '    RIGHT JOIN submissions on likes."submissionId" = submissions.id ' +
        '    LEFT JOIN "submissionTagRefs" on "submissionTagRefs"."submissionId" = submissions.id AND "submissionTagRefs"."tagId" = ' + tagId + ' ' +
        '    WHERE submissions."approvedAt" IS NOT NULL and "submissionTagRefs".id IS NOT NULL ' +
        '    GROUP BY submissions.id) as sl ' +
        'LEFT JOIN submissions on submissions.id = sl."submissionId" ' +
        'ORDER BY ' + sortColumn + (isDesc ? ' DESC ' : ' ASC ') +
        'LIMIT ' + limit + ' OFFSET ' + offset
  }

  sqlTrending (userId, sortColumn, isDesc, limit, offset) {
    return 'SELECT submissions.*, "upvotesCount", ("upvotesCount" * 3600000) / (CURRENT_DATE::DATE - "createdAt"::DATE) as "upvotesPerHour", (sl."isUpvoted" > 0) as "isUpvoted" from ' +
        '    (SELECT submissions.id as "submissionId", COUNT(likes.*) as "upvotesCount", SUM(CASE likes."userId" WHEN ' + userId + ' THEN 1 ELSE 0 END) as "isUpvoted" from likes ' +
        '    RIGHT JOIN submissions on likes."submissionId" = submissions.id ' +
        '    WHERE submissions."approvedAt" IS NOT NULL ' +
        '    GROUP BY submissions.id) as sl ' +
        'LEFT JOIN submissions on submissions.id = sl."submissionId" ' +
        'ORDER BY ' + sortColumn + (isDesc ? ' DESC ' : ' ASC ') +
        'LIMIT ' + limit + ' OFFSET ' + offset
  }

  sqlTagTrending (tagId, userId, sortColumn, isDesc, limit, offset) {
    return 'SELECT submissions.*, "upvotesCount", ("upvotesCount" * 3600000) / (CURRENT_DATE::DATE - "createdAt"::DATE) as "upvotesPerHour", (sl."isUpvoted" > 0) as "isUpvoted" from ' +
        '    (SELECT submissions.id as "submissionId", COUNT(likes.*) as "upvotesCount", SUM(CASE likes."userId" WHEN ' + userId + ' THEN 1 ELSE 0 END) as "isUpvoted" from likes ' +
        '    RIGHT JOIN submissions on likes."submissionId" = submissions.id ' +
        '    LEFT JOIN "submissionTagRefs" on "submissionTagRefs"."submissionId" = submissions.id AND "submissionTagRefs"."tagId" = ' + tagId + ' ' +
        '    WHERE submissions."approvedAt" IS NOT NULL and "submissionTagRefs".id IS NOT NULL ' +
        '    GROUP BY submissions.id) as sl ' +
        'LEFT JOIN submissions on submissions.id = sl."submissionId" ' +
        'ORDER BY ' + sortColumn + (isDesc ? ' DESC ' : ' ASC ') +
        'LIMIT ' + limit + ' OFFSET ' + offset
  }

  async create (submissionToCreate) {
    try {
      const result = await this.SequelizeServiceInstance.create(submissionToCreate)
      return { success: true, body: result }
    } catch (err) {
      return { success: false, error: err }
    }
  }

  async getByPk (submissionId) {
    return await this.SequelizeServiceInstance.findByPk(submissionId)
  }

  async getEagerByPk (submissionId) {
    return await this.SequelizeServiceInstance.findOneEager({ id: submissionId })
  }

  async getByName (submissionName) {
    const nameNormal = submissionName.trim().toLowerCase()
    return await this.SequelizeServiceInstance.findOne({ nameNormal: nameNormal })
  }

  async getByNameOrId (submissionNameOrId) {
    return await this.SequelizeServiceInstance.findOne({ [Op.or]: [{ id: submissionNameOrId }, { nameNormal: submissionNameOrId.trim().toLowerCase() }] })
  }

  async getEagerByNameOrId (submissionNameOrId) {
    return await this.SequelizeServiceInstance.findOneEager({ [Op.or]: [{ id: submissionNameOrId }, { nameNormal: submissionNameOrId.trim().toLowerCase() }] })
  }

  async get (submissionNameOrId) {
    const submission = await this.getByNameOrId(submissionNameOrId)
    return { success: true, body: submission }
  }

  async getSanitized (submissionNameOrId, userId) {
    let submission = await this.getEagerByNameOrId(submissionNameOrId)
    if (!submission) {
      return { success: false, error: 'Submission name or ID not found.' }
    }
    submission = await this.populate(submission, userId)

    return { success: true, body: submission }
  }

  async approve (submissionId) {
    const submission = this.getByNameOrId(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission name or ID not found.' }
    }
    submission.approve()
    await submission.save()

    return { success: true, body: submission }
  }

  async deleteIfOwner (userId, submissionId) {
    const submission = await this.getByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found.' }
    }

    if (toString(submission.userId) !== toString(userId)) {
      return { success: false, error: 'Insufficient privileges to delete submission.' }
    }

    await submission.delete()

    return { success: true, body: submission }
  }

  async populate (submission, userId) {
    const toRet = { ...submission }
    toRet.isUpvoted = toRet.likes.length ? toRet.likes.find(like => like.userId === userId) : false
    console.log(toRet)
    return toRet
  }

  async submit (userId, reqBody, sendEmail) {
    const validationResult = await this.validateSubmission(reqBody)
    if (!validationResult.success) {
      return validationResult
    }

    const user = await userService.getByPk(userId)
    if (!user) {
      return { success: false, error: 'User not found.' }
    }

    const submission = await this.SequelizeServiceInstance.new()
    submission.user = userId
    submission.name = reqBody.submissionName.trim()
    submission.nameNormal = reqBody.name.trim().toLowerCase()
    submission.contentUrl = reqBody.contentUrl.trim()
    submission.thumbnailUrl = reqBody.thumbnailUrl ? reqBody.thumbnailUrl.trim() : null
    submission.description = reqBody.description ? reqBody.description.trim() : ''

    const result = await this.create(submission)
    if (!result.success) {
      return result
    }

    const tags = []
    if (reqBody.tags) {
      const tagSplit = reqBody.tags.split(',')
      for (let i = 0; i < tagSplit.length; i++) {
        const tag = tagSplit[i].trim().toLowerCase()
        if (tag) {
          const tagModel = await tagService.createOrFetch(tag)
          tagModel.submissions.push(submission.id)
          await tagModel.save()
          tags.push(tagModel.id)
        }
      }
    }
    submission.tags = tags
    await submission.save()

    if (!sendEmail) {
      return result
    }

    if (!config.supportEmail.service) {
      console.log('Skipping email - account info not set.')
      return result
    }

    const transporter = nodemailer.createTransport({
      service: config.supportEmail.service,
      auth: {
        user: config.supportEmail.account,
        pass: config.supportEmail.password
      }
    })

    const mailBody = 'We have received your submission: \n\n' + submission.submissionName + '\n\n There is a simple manual review process from an administrator, primarily to ensure that your submission is best categorized within our normal metadata categories. Once approved, your submission will be immediately visible to other users. If our administrators need further input from you, in order to properly categorize your submission, they will reach out to your email address, here.\n\nThank you for your submission!'

    const mailOptions = {
      from: config.supportEmail.address,
      to: user.email,
      subject: 'MetriQ submission received and under review',
      text: mailBody
    }

    const emailResult = await transporter.sendMail(mailOptions)
    if (!emailResult.accepted || (emailResult.accepted[0] !== user.email)) {
      return { success: false, message: 'Could not send email.' }
    }

    return result
  }

  async update (submissionId, reqBody, userId) {
    const submission = await this.getByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found.' }
    }

    if (reqBody.submissionThumbnailUrl !== undefined) {
      submission.submissionThumbnailUrl = reqBody.submissionThumbnailUrl.trim() ? reqBody.submissionThumbnailUrl.trim() : null
    }
    if (reqBody.description !== undefined) {
      submission.description = reqBody.description.trim() ? reqBody.description.trim() : ''
    }
    await submission.save()

    return { success: true, body: submission }
  }

  async validateSubmission (reqBody) {
    if (!reqBody.submissionName) {
      return { success: false, error: 'Submission name cannot be blank.' }
    }

    if (!reqBody.submissionContentUrl || !reqBody.submissionContentUrl.trim()) {
      return { success: false, error: 'Submission content URL cannot be blank.' }
    }

    const tlSubmissionName = reqBody.submissionName.trim().toLowerCase()
    if (tlSubmissionName.length === 0) {
      return { success: false, error: 'Submission name cannot be blank.' }
    }

    const submissionNameMatch = await this.getByName(tlSubmissionName)
    if (submissionNameMatch) {
      return { success: false, error: 'Submission name already in use.' }
    }

    return { success: true }
  }

  async upvote (submissionId, userId) {
    const submission = await this.getByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found.' }
    }

    const userResponse = await userService.get(userId)
    if (!userResponse.success) {
      return { success: false, error: 'User not found.' }
    }
    const user = userResponse.body

    const index = submission.likes.indexOf(user.id)
    if (index >= 0) {
      submission.likes.splice(index, 1)
    } else {
      submission.likes.push(user.id)
    }
    await submission.save()

    return { success: true, body: submission }
  }

  async getByUserId (userId, startIndex, count) {
    const result = await this.SequelizeServiceInstance.findAndSort({ userId: userId }, [['createdAt', 'DESC']], startIndex, count)
    return { success: true, body: result }
  }

  async getTrending (startIndex, count, userId) {
    const result = (await sequelize.query(this.sqlTrending(userId, '"upvotesPerHour"', true, count, startIndex)))[0]
    return { success: true, body: result }
  }

  async getLatest (startIndex, count, userId) {
    const result = (await sequelize.query(this.sqlLike(userId, 'submissions."createdAt"', true, count, startIndex)))[0]
    return { success: true, body: result }
  }

  async getPopular (startIndex, count, userId) {
    const result = (await sequelize.query(this.sqlLike(userId, '"upvotesCount"', true, count, startIndex)))[0]
    return { success: true, body: result }
  }

  async getTrendingByTag (tagName, startIndex, count, userId) {
    const tag = await tagService.getByName(tagName)
    if (!tag) {
      return { success: false, error: 'Category not found' }
    }
    const tagId = tag.id

    const result = (await sequelize.query(this.sqlTagTrending(tagId, userId, '"upvotesPerHour"', true, count, startIndex)))[0]
    return { success: true, body: result }
  }

  async getLatestByTag (tagName, startIndex, count, userId) {
    const tag = await tagService.getByName(tagName)
    if (!tag) {
      return { success: false, error: 'Category not found' }
    }
    const tagId = tag.id

    const result = (await sequelize.query(this.sqlTagLike(tagId, userId, 'submissions."createdAt"', true, count, startIndex)))[0]
    return { success: true, body: result }
  }

  async getPopularByTag (tagName, startIndex, count, userId) {
    const tag = await tagService.getByName(tagName)
    if (!tag) {
      return { success: false, error: 'Category not found' }
    }
    const tagId = tag.id

    const result = (await sequelize.query(this.sqlTagLike(tagId, userId, '"upvotesCount"', true, count, startIndex)))[0]
    return { success: true, body: result }
  }

  async addOrRemoveTag (isAdd, submissionId, tagName, userId) {
    const submission = await this.getEagerByPk(submissionId)
    if (!submission) {
      return { success: false, error: 'Submission not found.' }
    }

    if (isAdd) {
      const tag = await tagService.createOrFetch(tagName)
      await submissionTagRefService.createOrFetch(submission.id, tag.id)
    } else {
      const tag = await tagService.getByName(tagName)
      if (!tag) {
        return { success: false, error: 'Tag not found.' }
      }
      const ref = await submissionTagRefService.getByFks(submission.id, tag.id)
      await ref.delete()
    }

    return { success: true, body: submission }
  }
}

module.exports = SubmissionService
