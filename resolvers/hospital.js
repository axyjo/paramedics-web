"use strict";

const db = require("../models");

const hospitalResolvers = {
  Query: {
    hospitals: () => db.hospital.findAll(),
    hospital(obj, args, context, info) {
      return db.hospital.findByPk(args.id);
    },
  },
  Mutation: {
    addHospital: (parent, args) => {
      return db.hospital.create({
        name: args.name,
      });
    },
    updateHospital: async (parent, args) => {
      await db.hospital
        .update(
          {
            name: args.name,
          },
          {
            where: {
              id: args.id,
            },
          }
        )
        .then((rowsAffected) => {
          if (rowsAffected[0] === 0) {
            throw new Error("Update failed for hospital table");
          }
        });
      return db.hospital.findByPk(args.id);
    },
    deleteHospital: async (parent, args) => {
      await db.patient
        .count({
          where: {
            hospitalId: args.id,
          },
        })
        .then((count) => {
          if (count > 0) {
            throw new Error(
              "Deletion failed; there are associated patients for this hospital"
            );
          }
        });

      await db.eventHospitals.destroy({
        where: {
          eventId: args.id,
        },
      });

      return db.hospital.destroy({
        where: {
          id: args.id,
        },
      });
    },
  },
};

exports.hospitalResolvers = hospitalResolvers;
