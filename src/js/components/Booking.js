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
    thisBooking.onFormSubmitHandler();
    thisBooking.starterSupport();
    thisBooking.showColors();
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


    const urls = {
      booking:      settings.db.url + '/' + settings.db.booking
                                    + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?'
                                    + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?'
                                    + params.eventsRepeat.join('&'),
    };

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
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  starterSupport(){
    const thisBooking = this;
    thisBooking.starters = {
      water: false,
      bread: false
    };
    const starterInputs = document.querySelectorAll('input[name="starter"]');
    for (let starterInput of starterInputs) {
      starterInput.addEventListener('click', function (evt) {
        thisBooking.starters[evt.target.getAttribute('value')] = evt.target.checked;
      });
 
    }
  }
  
 
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};

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

    thisBooking.updateDOM();
  }

  onFormSubmitHandler(){
    const thisBooking = this;
    const submitForm = thisBooking.dom.wrapper.querySelector('.booking-form');
    submitForm.addEventListener('submit', function(e){
      e.preventDefault();
      thisBooking.sendBooking();
    });
  }


  
  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if(typeof thisBooking.booked[date] === 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);


    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] === 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
   
   
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
  
    }
    
  }

  showColors() {
    const thisBooking = this;
    let gradient='';
    setTimeout(() => {
      for (let x = 12; x < 24; x = x + 0.5) {
        let color = 'rgba(63,223,34,1)';
        const booked = thisBooking.booked[thisBooking.date][x];
        if (booked&& booked.length < 2) {
          color = 'rgba(248,253,29,1)';
        }
        if (booked && (booked.length > 1)) {
          color = 'rgba(176,19,19,1)';
        }
        const counter = x -12;
        const start = parseInt(counter * 8.3);
        const end = parseInt((counter+ 0.5 )*8.3);
        gradient =  gradient + `${color} ${start}% ${end}%,`;
        const gradient2 = gradient.substring(0, gradient.length - 1);
        console.log(gradient2);
        
        console.log(gradient);
        console.log(`linear-gradient(90deg, ${gradient})`);
        const sliderBackground = document.querySelector('.rangeSlider');
        const beforeSliderBackground = document.querySelector('.rangeSlider__fill');

        sliderBackground.style.background = `linear-gradient(90deg, ${gradient2})`; 
   

        beforeSliderBackground.style.background = 'transparent';

      }
    }, 1000);
    
  }
 
  
  bookTable(){
    const thisBooking = this;
    for(let table of thisBooking.dom.tables){
      if(!table.classList.contains(classNames.booking.tableBooked)){
        table.addEventListener('click', function(){
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.bookedTableId = parseInt(tableId);
          table.classList.add(classNames.booking.tableBooked);
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

    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);

    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
   
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
  
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector('input[name="address"]');
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector('input[name="phone"]');

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
  
  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
   

    
    const payload = {
      date: thisBooking.datePicker.value,
      hour:thisBooking.hourPicker.value,
      table: thisBooking.bookedTableId,
      repeat: false,
      duration: thisBooking.hoursAmount.value,
      ppl:  thisBooking.peopleAmount.value, 
      starters: thisBooking.starters,
      address: thisBooking.dom.address.value,
      phone: thisBooking.dom.phone.value,
    };

    console.log('payload', payload);
    console.log(thisBooking.booked);

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
