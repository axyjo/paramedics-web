"use strict";

const db = require("../models");

const eventResolvers = {
  Query: {
    events: () => db.event.findAll(),
    event: (obj, args, context, info) => db.event.findByPk(args.id)
  },
  Event: {
    createdBy: (obj, args, context, info) => db.user.findByPk(obj.createdBy)
  },
  Mutation: {
    addEvent: (parent, args) => {
      const event = db.event.create({
        name: args.name,
        eventDate: args.eventDate,
        createdBy: args.createdBy,
        isActive: args.isActive
      });
      return event;
    },
    updateEvent: (parent, args) => {
      return db.event.update(
        {
          name: args.name,
          eventDate: args.eventDate,
          createdBy: args.createdBy,
          isActive: args.isActive
        },
        {
          where: { id: args.id }
        }
      );
    },
    deleteEvent: (parent, args) => {
      // Return status for destroy
      // 1 for successful deletion, 0 otherwise
      return db.event.destroy({
        where: {
          id: args.id
        }
      });
    }
  }
};

exports.eventResolvers = eventResolvers;
