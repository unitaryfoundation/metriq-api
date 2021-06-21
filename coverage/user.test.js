// tests/user.test.js

const dbHandler = require('./db-handler');
const UserService = require('../service/userService');

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => await dbHandler.connect());

/**
 * Clear all test data after every test.
 */
afterEach(async () => await dbHandler.clearDatabase());

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

/**
 * User test suite.
 */
describe('user', () => {

    it('can be deleted after creation and login', async () => {
        // Initialize
        const userService = new UserService()
        await userService.register(registration1)
        const loginResult = await userService.login(login1)

        // Act
        const result = await userService.delete(loginResult.body[0].id)

        // Assert
        expect(result)
            .toMatchObject({
                success: true
            })
    })

    it('user not found should yield failure', async () => {
        // Initialize
        const userService = new UserService()

        // Act
        const result = await userService.delete(undefinedUserId.id)

        // Assert
        expect(result)
            .toMatchObject({
                success: false
            })
    })

    it('user that is already deleted should fail to delete again', async () => {
        // Initialize
        const userService = new UserService()
        await userService.register(registration1)
        const loginResult = await userService.login(login1)
        await userService.delete(loginResult.body[0].id)

        // Act
        const result = await userService.delete(loginResult.body[0].id)

        // Assert
        expect(result)
            .toMatchObject({
                success: false
            })
    })

})

const registration1 = {
    username: 'Test1',
    email:'test@test.com',
    password:'TestUser1!',
    passwordConfirm: 'TestUser1!'
}

const login1 = {
    username: 'Test1',
    password: 'TestUser1!'
}

const undefinedUserId = {
    username: 'Test',
    id: "60cbedcdf5cf30ca9d645ab7"
}
