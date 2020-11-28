import {templates, select, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
  constructor(wrapper){
    const thisBooking = this;

    thisBooking.render(wrapper);
    thisBooking.initWidgets(); 
    thisBooking.getData();
    thisBooking.bookTable();
    thisBooking.makeBooked(); //?
    
    // thisBooking.dom.wrapper = wrapper;
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking:[
        startDateParam, 
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam, 
        endDateParam, 
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    console.log('getData params', params);

    const urls = {
      booking:      settings.db.url + '/' + settings.db.booking 
                                    + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' 
                                    + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' 
                                    + params.eventsRepeat.join('&'),
    };
    console.log('getData urls', urls);
    
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json()
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    console.log('------');
    console.log(thisBooking.booked);

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate; 

    for(let item of eventsRepeat){
      if(item.repeat === 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();

  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if(typeof thisBooking.booked[date] === 'undefined'){
      thisBooking.booked[date] = {};
      // console.log(thisBooking.booked[date]);
    }

    const startHour = utils.hourToNumber(hour);
   

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      // console.log('loop', hourBlock);
      if(typeof thisBooking.booked[date][hourBlock] === 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
    const submitButton = document.querySelector(select.containerOf.booking);
    submitButton.addEventListener('submit', function(e){
      e.preventDefault();
      // console.log('check this out');
      thisBooking.sendBooking();
    });
        
  }  

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] === 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined'
    ){
      allAvailable = true;
    }
    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
        console.log(table);
      }
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
      //new code:
   
      // if(!table.classList.contains(classNames.booking.bookTable)){
      //   table.addEventListener('click', function(){
      //     console.log(`----> You have booked table ${tableId}`);
      //     table.classList.add(classNames.booking.bookTable);
      //   });
      // }
    }
  }
  //new code:
  bookTable(){
    const thisBooking = this;
    for(let table of thisBooking.dom.tables){
      if(!table.classList.contains(classNames.booking.tableBooked)){
        table.addEventListener('click', function(){
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          console.log(`----> You have booked table ${tableId}`);
          table.classList.add(classNames.booking.tableBooked);
          console.log(thisBooking.booked);
          console.log(tableId);
        });
      }
    }
  }
  


  render(wrapper){
    const thisBooking = this;

    const generateHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = wrapper;
 
    wrapper.innerHTML = generateHTML;
    
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    // console.log(wrapper);

    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);

    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    console.log(wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    // thisBooking.dom.tables = thisBooking.wrapper.querySelectorAll(select.booking.tables);
    console.log(thisBooking.dom.tables);
  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
   
  }
  //new code
  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    console.log(thisBooking.hourPicker);

    const payload = {
      date: thisBooking.datePicker.value,
      hour:thisBooking.hourPicker.value,
      // table: tableId,
      repeat: false,
      duration: thisBooking.hoursAmount.value,
      ppl:  thisBooking.peopleAmount.value, 
      starters: [],
    };

    console.log('payload', payload);

    // for(let starter of thisBooking.starters){
    //   if(starter.selected){
    //     console.log(starter.selected);
    //     payload.starters.push(starter);
    //   }
    // }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse ', parsedResponse);
      });
  }
}



export default Booking;