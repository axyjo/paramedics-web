'use strict';

const db = require('../models');

module.exports = {
  up: async (queryInterface) => {
    const user = await db.user.create({
      name: 'Firas Mansour',
      email: 'mansour_is_a_cool_guy@gmail.com',
      accessLevel: 'SUPERVISOR',
      password: 'asdfgh1234',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const event = await db.event.create({
      eventDate: new Date(),
      name: 'St. Patricks',
      createdBy: user.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return queryInterface.bulkInsert('collectionPoints', [
      {
        name: 'Checkpoint 0',
        eventId: event.id,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Checkpoint 1',
        eventId: event.id,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('collectionPoints', null, {});
  },
};
