'use strict';

const db = require('../models');
const { validateRole } = require('../utils/validators');

const ambulanceResolvers = {
  Query: {
    ambulances: () => {
      validateRole(['COMMANDER']);
      return db.ambulance.findAll({
        include: [
          {
            model: db.event,
          },
        ],
      });
    },
    ambulance: (parent, args) => {
      validateRole(['COMMANDER']);
      db.ambulance.findByPk(args.id, {
        include: [
          {
            model: db.event,
          },
        ],
      });
    },
    Mutation: {
      addAmbulance: (parent, args) => {
        validateRole(['COMMANDER']);
        db.ambulance.create({
          vehicleNumber: args.vehicleNumber,
        });
      },
      updateAmbulance: (parent, args) => {
        validateRole(['COMMANDER']);
        db.ambulance
          .update(
            {
              vehicleNumber: args.vehicleNumber,
            },
            {
              where: {
                id: args.id,
              },
            }
          )
          .then((rowsAffected) => {
            if (rowsAffected[0] === 0) {
              throw new Error('Failed update for ambulance ID: ' + args.id);
            }
            return db.ambulance.findByPk(args.id);
          });
      },
      restoreAmbulance: async (parent, args) => {
        // TODO: ask about role
        validateRole(['ADMIN', 'COMMANDER']);
        await Promise.all([
          db.ambulance.restore({
            where: {
              id: args.id,
            },
          }),
          // Restoring event association if event also availiable
          db.eventAmbulances
            .findAll({
              where: {
                ambulanceId: args.id,
              },
              include: [
                {
                  model: db.event,
                  required: true,
                },
              ],
              paranoid: false,
            })
            .then((associatedEvents) =>
              Promise.all(
                associatedEvents.map((associatedEvent) =>
                  db.eventAmbulances.restore({
                    where: {
                      eventId: associatedEvent.eventId,
                      ambulanceId: args.id,
                    },
                  })
                )
              )
            ),
        ]);

        return db.ambulance.findByPk(args.id);
      },
      deleteAmbulance: async (parent, args) => {
        validateRole(['ADMIN', 'COMMANDER']);
        await Promise.all([
          db.patient
            .count({
              where: {
                ambulanceId: args.id,
              },
            })
            .then((count) => {
              if (count > 0) {
                throw new Error(
                  'Deletion failed; there are associated patients for ambulance ID: ' +
                    args.id
                );
              }
            }),
          db.eventAmbulances.destroy({
            where: {
              ambulanceId: args.id,
            },
          }),
        ]);

        return db.ambulance.destroy({
          where: {
            id: args.id,
          },
        });
      },
    },
  },
};
exports.ambulanceResolvers = ambulanceResolvers;
