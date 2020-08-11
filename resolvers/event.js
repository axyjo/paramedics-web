'use strict';

const db = require('../models');

const eventResolvers = {
  Query: {
    events: () =>
      db.event.findAll({
        include: [
          {
            model: db.ambulance,
          },
          {
            model: db.hospital,
          },
        ],
      }),
    event: (obj, args) =>
      db.event.findByPk(args.id, {
        include: [
          {
            model: db.ambulance,
          },
          {
            model: db.hospital,
          },
        ],
      }),
    archivedEvents: () =>
      db.event.findAll({
        where: {
          isActive: false,
        },
      }),
  },
  Event: {
    createdBy: (obj) => db.user.findByPk(obj.createdBy),
  },
  Mutation: {
    addEvent: async (parent, args) => {
      // Check if createdBy is valid
      await db.user.findByPk(args.createdBy).then((user) => {
        if (!user) {
          throw new Error('Invalid user ID: ' + args.createdBy);
        }
      });

      await db.event.create({
        name: args.name,
        eventDate: args.eventDate,
        createdBy: args.createdBy,
        isActive: args.isActive,
      });

      return {
        name: args.name,
        eventDate: args.eventDate,
        createdBy: args.createdBy,
        isActive: args.isActive,
        ambulances: [],
        hospitals: [],
      };
    },
    updateEvent: async (parent, args) => {
      // Checking if event is valid
      await db.event.findByPk(args.id).then((event) => {
        if (!event) {
          throw new Error('Invalid event ID: ' + args.id);
        }
      });

      // Checking if user is valid
      if (args.createdBy) {
        await db.user.findByPk(args.createdBy).then((user) => {
          if (!user) {
            throw new Error('Invalid user ID: ' + args.createdBy);
          }
        });
      }

      if (args.ambulances) {
        // Checking if all ambulances exist
        await Promise.all(
          args.ambulances.map((ambulanceId) =>
            db.ambulance.findByPk(ambulanceId.id).then((ambulance) => {
              if (!ambulance) {
                throw new Error('Invalid ambulance ID: ' + ambulanceId.id);
              }
            })
          )
        );

        // Removing all instances of this particular event in the junction table
        await db.eventAmbulances.destroy({
          where: {
            eventId: args.id,
          },
        });

        // Adding in all relations of the given event and the given ambulances
        await Promise.all(
          args.ambulances.map((ambulanceId) =>
            db.eventAmbulances.create({
              eventId: args.id,
              ambulanceId: ambulanceId.id,
            })
          )
        );
      }

      if (args.hospitals) {
        // Checking if all hospitals exist
        await Promise.all(
          args.hospitals.map((hospitalId) =>
            db.hospital.findByPk(hospitalId.id).then((hospital) => {
              if (!hospital) {
                throw new Error('Invalid hospital ID: ' + hospitalId.id);
              }
            })
          )
        );

        // Removing all instances of this particular event in the junction table
        await db.eventHospitals.destroy({
          where: {
            eventId: args.id,
          },
        });

        // Adding in all relations of the given event and the given hospitals
        await Promise.all(
          args.hospitals.map((hospitalId) =>
            db.eventHospitals.create({
              eventId: args.id,
              hospitalId: hospitalId.id,
            })
          )
        );
      }

      await db.event.update(
        {
          name: args.name,
          eventDate: args.eventDate,
          createdBy: args.createdBy,
          isActive: args.isActive,
        },
        {
          where: { id: args.id },
        }
      );
      return db.event.findByPk(args.id, {
        include: [
          {
            model: db.ambulance,
            attributes: ['id', 'vehicleNumber', 'createdAt', 'updatedAt'],
          },
          {
            model: db.hospital,
            attributes: ['id', 'name', 'createdAt', 'updatedAt'],
          },
        ],
      });
    },
    addAmbulancesToEvent: async (parent, args) => {
      // Checking if event exists
      await db.event.findByPk(args.eventId).then(async (event) => {
        if (!event) {
          throw new Error('Invalid event ID: ' + args.eventId);
        }
      });

      // Checking if all ambulances exist
      await Promise.all(
        args.ambulances.map((ambulanceId) =>
          db.ambulance.findByPk(ambulanceId.id).then((ambulance) => {
            if (!ambulance) {
              throw new Error('Invalid ambulance ID: ' + ambulanceId.id);
            }
          })
        )
      );

      await Promise.all(
        args.ambulances.map((ambulanceId) =>
          db.eventAmbulances
            .findAll({
              where: {
                eventId: args.eventId,
                ambulanceId: ambulanceId.id,
              },
              paranoid: false,
            })
            .then((eventAmbulanceAssociations) => {
              if (eventAmbulanceAssociations.length === 0) {
                db.eventAmbulances.create({
                  eventId: args.eventId,
                  ambulanceId: ambulanceId.id,
                });
              } else if (eventAmbulanceAssociations.length > 1) {
                db.eventAmbulances
                  .destroy({
                    where: {
                      eventId: args.eventId,
                      ambulanceId: ambulanceId.id,
                    },
                    force: true,
                  })
                  .then(() =>
                    db.eventAmbulances.create({
                      eventId: args.eventId,
                      ambulanceId: ambulanceId.id,
                    })
                  );
              } else {
                db.eventAmbulances.restore({
                  where: {
                    eventId: args.eventId,
                    ambulanceId: ambulanceId.id,
                  },
                });
              }
            })
        )
      );

      // Returning new event
      return db.event.findByPk(args.eventId, {
        include: [
          {
            model: db.ambulance,
          },
          {
            model: db.hospital,
          },
        ],
      });
    },

    addHospitalsToEvent: async (parent, args) => {
      // Checking if event exists
      await db.event.findByPk(args.eventId).then(async (event) => {
        if (!event) {
          throw new Error('Invalid event ID: ' + args.eventId);
        }
      });

      // Checking if all hospitals exist
      await Promise.all(
        args.hospitals.map((hospitalId) =>
          db.hospital.findByPk(hospitalId.id).then((hospital) => {
            if (!hospital) {
              throw new Error('Invalid hospital ID: ' + hospitalId.id);
            }
          })
        )
      );

      await Promise.all(
        args.hospitals.map((hospitalId) =>
          db.eventHospitals
            .findAll({
              where: {
                eventId: args.eventId,
                hospitalId: hospitalId.id,
              },
              paranoid: false,
            })
            .then((eventHospitalAssociations) => {
              if (eventHospitalAssociations.length === 0) {
                db.eventHospitals.create({
                  eventId: args.eventId,
                  hospitalId: hospitalId.id,
                });
              } else if (eventHospitalAssociations.length > 1) {
                db.eventHospitals
                  .destroy({
                    where: {
                      eventId: args.eventId,
                      hospitalId: hospitalId.id,
                    },
                    force: true,
                  })
                  .then(() =>
                    db.eventHospitals.create({
                      eventId: args.eventId,
                      hospitalId: hospitalId.id,
                    })
                  );
              } else {
                db.eventHospitals.restore({
                  where: {
                    eventId: args.eventId,
                    hospitalId: hospitalId.id,
                  },
                });
              }
            })
        )
      );

      // Returning updated event
      return db.event.findByPk(args.eventId, {
        include: [
          {
            model: db.ambulance,
          },
          {
            model: db.hospital,
          },
        ],
      });
    },

    deleteAmbulancesFromEvent: async (parent, args) => {
      // Checking if event exists
      await db.event.findByPk(args.eventId).then(async (event) => {
        if (!event) {
          throw new Error('Invalid event ID: ' + args.eventId);
        }
      });

      // Checking if all ambulances exist
      await Promise.all(
        args.ambulances.map((ambulanceId) =>
          db.ambulance.findByPk(ambulanceId.id).then((ambulance) => {
            if (!ambulance) {
              throw new Error('Invalid ambulance ID: ' + ambulanceId.id);
            }
          })
        )
      );

      // Removing association in eventAmbulance junction table
      await Promise.all(
        args.ambulances.map((ambulanceId) =>
          db.eventAmbulances.destroy({
            where: {
              eventId: args.eventId,
              ambulanceId: ambulanceId.id,
            },
          })
        )
      );

      // Returning updated event
      return db.event.findByPk(args.eventId, {
        include: [
          {
            model: db.ambulance,
          },
          {
            model: db.hospital,
          },
        ],
      });
    },

    deleteHospitalsFromEvent: async (parent, args) => {
      // Checking if event exists
      await db.event.findByPk(args.eventId).then(async (event) => {
        if (!event) {
          throw new Error('Invalid event ID: ' + args.eventId);
        }
      });

      // Checking if all hospitals exist
      await Promise.all(
        args.hospitals.map((hospitalId) =>
          db.hospital.findByPk(hospitalId.id).then((hospital) => {
            if (!hospital) {
              throw new Error('Invalid hospital ID: ' + hospitalId.id);
            }
          })
        )
      );

      // Removing association in eventHospitals junction table
      await Promise.all(
        args.hospitals.map((hospitalId) =>
          db.eventHospitals.destroy({
            where: {
              eventId: args.eventId,
              hospitalId: hospitalId.id,
            },
          })
        )
      );

      // Returning updated event
      return db.event.findByPk(args.eventId, {
        include: [
          {
            model: db.ambulance,
          },
          {
            model: db.hospital,
          },
        ],
      });
    },

    deleteEvent: async (parent, args) => {
      // Return status for destroy
      // 1 for successful deletion, 0 otherwise
      await db.eventAmbulances.destroy({
        where: {
          eventId: args.id,
        },
      });

      await db.eventHospitals.destroy({
        where: {
          eventId: args.id,
        },
      });

      return db.event.destroy({
        where: {
          id: args.id,
        },
        individualHooks: true,
      });
    },
  },
};

exports.eventResolvers = eventResolvers;
