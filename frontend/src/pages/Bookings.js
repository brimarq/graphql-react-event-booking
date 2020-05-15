import React, { useState, useContext, useEffect } from 'react';
import Spinner from '../components/Spinner/Spinner';
import AuthContext from '../context/auth-context';
import BookingList from '../components/Bookings/BookingList/BookingList';
import BookingsChart from '../components/Bookings/BookingsChart/BookingsChart';
import BookingsControl from '../components/Bookings/BookingsControl/BookingsControl';

function BookingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [outputType, setOutputType] = useState('list');

  const auth = useContext(AuthContext);

  // fetch the bookings
  useEffect(() => {
    setIsLoading(true);
    const requestBody = {
      query: `
        query {
          bookings {
            _id
            createdAt
            event {
              _id
              title
              date
              price
            }
          }
        }
      `
    };

    fetch('http://localhost:8000/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody), 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    })
    .then(res => {
      if(res.status !== 200 & res.status !== 201) {
        throw new Error('Failed!');
      }
      return res.json();
    })
    .then(resData => {
      const bookings = resData.data.bookings;
      setBookings(bookings);
      setIsLoading(false);
    })
    .catch(err => {
      console.log(err);
      setIsLoading(false);
    });
  }, [auth.token]);

  const deleteBookingHandler = bookingId => {
    setIsLoading(true);
    const requestBody = {
      query: `
        mutation CancelBooking($id: ID!) {
          cancelBooking(bookingId: $id) {
            _id
            title
          }
        }
      `,
      variables: {
        id: bookingId
      }
    };

    fetch('http://localhost:8000/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody), 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    })
    .then(res => {
      if(res.status !== 200 & res.status !== 201) {
        throw new Error('Failed!');
      }
      return res.json();
    })
    .then(resData => {
      const updatedBookings = bookings.filter(booking => {
        return booking._id !== bookingId;
      });
      setBookings(updatedBookings);
      setIsLoading(false);
    })
    .catch(err => {
      console.log(err);
      setIsLoading(false);
    });
  };

  const changeOutputTypeHandler = outputType => {
    if (outputType === 'list') {
      setOutputType('list');
    } else {
      setOutputType('chart');
    }
  };

  let content = <Spinner />;
  if (!isLoading) {
    content = (
      <>
        <BookingsControl activeOutputType={outputType} onChange={changeOutputTypeHandler}/>
        <div>
          {outputType === 'list' 
            ? <BookingList bookings={bookings} onDelete={deleteBookingHandler}/> 
            : <BookingsChart bookings={bookings}/>
          }
        </div>
      </>
    );
  }

  return content;
}



export default BookingsPage;