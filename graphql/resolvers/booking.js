const Booking = require('../../models/booking');
const Event = require('../../models/event');
const { transformBooking, transformEvent } = require('./merge');

module.exports = {
  bookings: async (args, req) => {
    try {
      // Allow only authenticated users for this resolver
      if (!req.isAuth) {
        throw new Error('Unauthenticated!');
      }
      const bookings = await Booking.find();
      return bookings.map(booking => transformBooking(booking));
    } catch(err) {
      throw err;
    }
  },
  bookEvent: async (args, req) => {
    try {
      // Allow only authenticated users for this resolver
      if (!req.isAuth) {
        throw new Error('Unauthenticated!');
      }
      const fetchedEvent = await Event.findOne({ _id: args.eventId });
      const booking = new Booking({
        user: req.userId,
        event: fetchedEvent
      });
      const result = await booking.save();
      return transformBooking(result);
    } catch (err) { 
      throw err; 
    }
  },
  cancelBooking: async (args, req) => {
    try {
      // Allow only authenticated users for this resolver
      if (!req.isAuth) {
        throw new Error('Unauthenticated!');
      }
      const booking = await Booking.findById(args.bookingId).populate('event');
      const event = transformEvent(booking.event);
      await Booking.deleteOne({ _id: args.bookingId });
      return event;
    } catch (err) { 
      throw err; 
    }
  }
};