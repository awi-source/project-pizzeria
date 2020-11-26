class BaseWidget{
  constructor(wrapperElement, initialValue){
    const thisWidget = this;

    thisWidget.dom = {};
    // console.log(thisWidget.dom);
    thisWidget.dom.wrapper = wrapperElement;
    thisWidget.correctValue = initialValue;
    // console.log(initialValue);
  }

  get value(){
    const thisWidget = this;
    // console.log(thisWidget.correctValue);
    return thisWidget.correctValue;

  }

  set value(value){
    const thisWidget = this;

    const newValue = thisWidget.parseValue(value);

    if(newValue!==thisWidget.correctValue && thisWidget.isValid(newValue)){
      thisWidget.correctValue = newValue;
      thisWidget.announce();
    }

    thisWidget.renderValue();
  }

  parseValue(value){
    return parseInt(value);

  }

  isValid(value){
    return !isNaN(value);

  }

  renderValue(){
    const thisWidget = this;
    thisWidget.dom.wrapper.innerHTML = thisWidget.value;
    
  }

  setValue(value){
    const thisWidget = this;
    thisWidget.value = value;
    // console.log(value);
  }

  announce(){
    const thisWidget = this;

    const event = new CustomEvent ('updated', {
      bubbles: true,
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }

 

}

export default BaseWidget;