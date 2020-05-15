import React, { useState, useContext, useRef, useEffect } from 'react';
import './Events.css';
import Modal from '../components/Modal/Modal';
import Backdrop from '../components/Backdrop/Backdrop';
import EventList from '../components/Events/EventList/EventList';
import Spinner from '../components/Spinner/Spinner';
import AuthContext from '../context/auth-context';


function EventsPage() {
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const auth = useContext(AuthContext);

  const titleElRef = useRef(null);
  const priceElRef = useRef(null);
  const dateElRef = useRef(null);
  const descriptionElRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const requestBody = {
      query: `
        query {
          events {
            _id
            title
            description
            date
            price
            creator {
              _id
              email
            }
          }
        }
      `
    };

    fetch('http://localhost:8000/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody), 
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if(res.status !== 200 & res.status !== 201) {
        throw new Error('Failed!');
      }
      return res.json();
    })
    .then(resData => {
      const events = resData.data.events;
      setEvents(events);
      setIsLoading(false);
    })
    .catch(err => {
      console.log(err);
      setIsLoading(false);
    });
  }, []);

  const startCreateEventHandler = () => setCreating(true);


  const modalConfirmHandler = () => {
    setCreating(false);
    const title = titleElRef.current.value;
    const price = priceElRef.current.value;
    const date = dateElRef.current.value;
    const description = descriptionElRef.current.value;

    if (
      title.trim().length === 0 || 
      price.trim().length === 0 || 
      date.trim().length === 0 || 
      description.trim().length === 0  
    ) {
      return;
    }

    const requestBody = {
      query: `
        mutation CreateEvent($title: String!, $desc: String!, $price: Float!, $date: String!) {
          createEvent(eventInput: { 
            title: $title, 
            description: $desc,
            price: $price,
            date: $date
          }) {
            _id
            title
            description
            date
            price
          }
        }
      `,
      variables: {
        title: title, 
        desc: description,
        price: +price,
        date: date
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
      setEvents(prevEvents => {
        const updatedEvents = [...prevEvents];
        updatedEvents.push({
          _id: resData.data.createEvent._id,
          title: resData.data.createEvent.title,
          description: resData.data.createEvent.description,
          date: resData.data.createEvent.date,
          price: resData.data.createEvent.price,
          creator: {
            _id: auth.userId
          }
        });
        return updatedEvents;
      });
    })
    .catch(err => {
      console.log(err);
    });
  };
  
  const modalCancelHandler = () => {
    setCreating(false);
    setSelectedEvent(null);
  };

  const showDetailHandler = eventId => {
    const selectedEvent = events.find(e => e._id === eventId);
    setSelectedEvent(selectedEvent);
  }

  const bookEventHandler = () => {
    if (!auth.token) {
      setSelectedEvent(null);
      return;
    }

    const requestBody = {
      query: `
        mutation BookEvent($id: ID!) {
          bookEvent(eventId: $id) {
            _id
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        id: selectedEvent._id
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
      console.log(resData);
      setSelectedEvent(null);
    })
    .catch(err => {
      console.log(err);
    });
  }

  return (
    <>
      {(creating || selectedEvent) && <Backdrop />}
      {creating && (
        <Modal 
          title="Add Event" 
          canCancel 
          canConfirm 
          onCancel={modalCancelHandler} 
          onConfirm={modalConfirmHandler}
          confirmText="Confirm"
        >
          <form action="">
            <div className="form-control">
              <label htmlFor="title">Title</label>
              <input type="text" id="title" ref={titleElRef}/>
            </div>
            <div className="form-control">
              <label htmlFor="price">Price</label>
              <input type="number" id="price" ref={priceElRef}/>
            </div>
            <div className="form-control">
              <label htmlFor="date">Date</label>
              <input type="datetime-local" id="date" ref={dateElRef}/>
            </div>
            <div className="form-control">
              <label htmlFor="description">Description</label>
              <textarea name="" id="description" rows="4" ref={descriptionElRef}></textarea>
            </div>
          </form>
        </Modal>
      )} 
      {selectedEvent && (
        <Modal 
          title={selectedEvent.title} 
          canCancel 
          canConfirm 
          onCancel={modalCancelHandler} 
          onConfirm={bookEventHandler}
          confirmText={auth.token ? 'Book' : 'Confirm'}
        >
          <h1>{selectedEvent.title}</h1>
          <h2>${selectedEvent.price} - {new Date(selectedEvent.date).toLocaleDateString()}</h2>
          <p>{selectedEvent.description}</p>
        </Modal>
      )}
      {auth.token && (
        <div className="events-control">
          <p>Share your own Events!</p>
          <button className="btn" onClick={startCreateEventHandler}>Create Event</button>
        </div>
      )}
      {isLoading 
        ? (<Spinner />) 
        : (<EventList 
              events={events} 
              authUserId={auth.userId}
              onViewDetail={showDetailHandler}
            />)
      }
    </>
    
  );

}

export default EventsPage;