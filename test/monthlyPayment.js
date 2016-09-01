'use strict'
var pgp = require('pg-promise')();
var db = pgp({
    host: 'localhost',
    port: 5432,
    database: 'sber-together-api-test',
    user: 'gorod',
    password: '123qwe'
});

beforeEach(function() {
    return db.none(`DELETE FROM "PayDayHistory";
                    DELETE FROM "DesiredAmountHistory";
                    DELETE FROM "Card";
                    DELETE FROM "UserFundSubsription";
                    DELETE FROM "UserFund";
                    DELETE FROM "SberUser";`)
        .then(() => {
            return db.one(`INSERT INTO "SberUser" (id, "updatedAt", "createdAt")
                                        VALUES (DEFAULT, now(), now()) returning id`)
        })
        .then(data => {
            return db.one(`INSERT INTO "UserFund" (id, "createdAt", "updatedAt", enabled, "creatorId")
                                        VALUES (DEFAULT, now(), now(), true, ${data.id}) returning *`)
        })
        .then(data => {
            return db.one(`INSERT INTO "UserFundSubsription" (id, "sberUserId", "userFundId", "createdAt", "updatedAt", enabled)
                                        VALUES (DEFAULT, ${data.creatorId}, ${data.id}, now(), now(), true) returning *`)
        })
        .then(data => {
            return db.one(`INSERT INTO "Card" (id, "sberUserId", "bindingId", "createdAt", "updatedAt")
                                        VALUES (DEFAULT, ${data.sberUserId}, '123456', now(), now()) returning *`)
        })
        .then(() => {
            return db.one('SELECT id FROM "UserFundSubsription" LIMIT 1')
        })
        .then(data => {
            return db.one(`INSERT INTO "DesiredAmountHistory" (id, "userFundSubscriptionId", "payDate", "amount", "changer", "createdAt", "updatedAt")
                                            VALUES (DEFAULT, ${data.id}, now(), '20000', 'user', now(), now()) returning *`)
        })
        .then(data => {
            return db.none(`INSERT INTO "PayDayHistory" (id, "subscriptionId", "payDate", "createdAt", "updatedAt")
                                            VALUES (DEFAULT, ${data.userFundSubscriptionId}, now(), now(), now())`)
        })
        .catch(console.log)
})


describe("Monthly payments", function() {
    it("should pay for this day", function() {
        return db.one('SELECT "id" FROM "SberUser"')
                .then(console.log)

    })
})
