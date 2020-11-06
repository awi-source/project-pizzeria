  
/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  // CODE ADDED END
  };

  // eslint-disable-next-line no-unused-vars
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  // CODE ADDED END
  };

  class Product {
    constructor(id, data){
      const thisCartProduct = this;
      thisCartProduct.id = id;
      thisCartProduct.data = data;
      thisCartProduct.renderInMenu();
      thisCartProduct.getElements();
      thisCartProduct.initAccordion();
      thisCartProduct.initOrderForm();
      thisCartProduct.initAmountWidget();
      thisCartProduct.processOrder();
    }
    renderInMenu(){
      const thisCartProduct = this;

      
      const generateHTML = templates.menuProduct(thisCartProduct.data);
  
      thisCartProduct.element = utils.createDOMFromHTML(generateHTML);
      // console.log(thisCartProduct.element);

      const menuContainer = document.querySelector(select.containerOf.menu);
      // console.log(menuContainer);
  
      menuContainer.appendChild(thisCartProduct.element);
    }
    getElements(){
      const thisCartProduct = this;
    
      thisCartProduct.accordionTrigger = thisCartProduct.element.querySelector(select.menuProduct.clickable);
      thisCartProduct.form = thisCartProduct.element.querySelector(select.menuProduct.form);
      thisCartProduct.formInputs = thisCartProduct.form.querySelectorAll(select.all.formInputs);
      thisCartProduct.cartButton = thisCartProduct.element.querySelector(select.menuProduct.cartButton);
      thisCartProduct.priceElem = thisCartProduct.element.querySelector(select.menuProduct.priceElem);
      thisCartProduct.imageWrapper = thisCartProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisCartProduct.amountWidgetElem = thisCartProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion(){
      const thisCartProduct = this;
      const clickableTrigger = thisCartProduct.accordionTrigger;
      clickableTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.element.classList.toggle('active');
        const activeProducts = document.querySelectorAll('#product-list > .product.active');
        for(let activeProduct of activeProducts){
          if(activeProduct !== thisCartProduct.element){
            activeProduct.classList.remove('active');
          }
        }
      });
    }
    initOrderForm(){
      const thisCartProduct = this;

      thisCartProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCartProduct.processOrder();
      });
      
      for(let input of thisCartProduct.formInputs){
        input.addEventListener('change', function(){
          thisCartProduct.processOrder();
        });
      }
      
      thisCartProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.processOrder();
        thisCartProduct.addToCart();
      });
      
    }
    processOrder(){
      const thisCartProduct = this;

      const formData = utils.serializeFormToObject(thisCartProduct.form);

      thisCartProduct.params = {};
      let price = thisCartProduct.data.price;

      for(let paramId in thisCartProduct.data.params){
  
        const param = thisCartProduct.data.params[paramId];

        for(let optionId in param.options){
   
          const option = param.options[optionId];

          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
   
          if(optionSelected && !option.default){
            const addOptionPrice = option.price;
            price = price + addOptionPrice;

          }else if(!optionSelected && option.default){

            const subtractOptionPrice = option.price;
            price = price - subtractOptionPrice;
          
          }
          if(optionSelected === true){  
            const chosenImages = thisCartProduct.imageWrapper.querySelectorAll(`.${paramId}-${optionId}`);
            if(!thisCartProduct.params[paramId]){
              thisCartProduct.params[paramId] = {
                label: param.label,
                options: {},
              };
            }
            thisCartProduct.params[paramId].options[optionId] = option.label;

            for(let chosenImage of chosenImages){
              chosenImage.classList.add('active');
            }          
          } else {
            const chosenImages = thisCartProduct.imageWrapper.querySelectorAll(`.${paramId}-${optionId}`);
            for(let chosenImage of chosenImages){
              chosenImage.classList.remove('active');
            }
          } 
        }
      }
     
      /* multiply price by amount */
      thisCartProduct.priceSingle = price;
      // console.log(price);
      thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
      // console.log(thisCartProduct.price);

      /* set the contents of thisCartProduct.priceElem to be the value of variable price */
      thisCartProduct.priceElem.innerHTML = thisCartProduct.price;
      // console.log('params: ', thisCartProduct.params);
    }
    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.amountWidgetElem);
      thisCartProduct.amountWidgetElem.addEventListener('updated', function(){
        thisCartProduct.processOrder();
      });
    }
    addToCart(){
      const thisCartProduct = this;

      thisCartProduct.name = thisCartProduct.data.name;
      thisCartProduct.amount = thisCartProduct.amountWidget.value;

      app.cart.add(thisCartProduct);
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
      // console.log('AmountWidget: ', thisWidget);
    //  console.log('constructor arguments: ', element);
    }
    getElements(element){
      const thisWidget = this;
  
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      if(newValue!==thisWidget.value && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value); 
      });

      thisWidget.linkDecrease.addEventListener('click',  function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce(){
      const thisWidget = this;

      // const event = new Event('updated');
      const event = new CustomEvent ('updated', {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];
      console.log(thisCart.products);
      
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
     

      thisCart.getElements(element);
      thisCart.initActions();
  
    }
    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      // thisCart.dom.productList = thisCart.dom;//check this

      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);   

      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

      for(let key of thisCart.renderTotalsKeys){
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
        // console.log(thisCart.dom[key]);
      }
    }
    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle('active');
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.remove(event.detail.cartProduct);
      });
    }
    add(menuProduct){
      const thisCart = this;
      // console.log('adding product ', menuProduct);
      const generatedHTML = templates.cartProduct(menuProduct);
      // console.log(generatedHTML);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      // console.log(generatedDOM);
      // const cartContainer = thisCart.dom.wrapper.querySelector('.cart__order-summary');
      const cartContainer = thisCart.dom.wrapper.querySelector(select.cart.productList);
      // console.log(cartContainer);
      cartContainer.appendChild(generatedDOM);
      // thisCart.products.push(menuProduct);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      // console.log('thisCart.products ', thisCart.products);
      thisCart.update();
    }
    update(){
      const thisCart = this;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0; 
      for(let product of thisCart.products){
        thisCart.subtotalPrice += product.price;
        thisCart.totalNumber += product.amount;
        
      }
      
      if(thisCart.products.length !== 0){
        thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      } else if(thisCart.products.length === 0){
        thisCart.deliveryFee = 0;
      }
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

      console.log('totalNumber: ', thisCart.totalNumber);
      console.log('subtotalPrice: ', thisCart.subtotalPrice);
      console.log('totalPrice: ', thisCart.totalPrice);
      for(let key of thisCart.renderTotalsKeys){
        for(let elem of thisCart.dom[key]){
          elem.innerHTML = thisCart[key];
        }
      }
    }
    remove(cartProduct){
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);
      // thisCart.products.splice(index, 1);
      // thisCart.remove(cartProduct.dom.wrapper);
      cartProduct.dom.wrapper.remove(thisCart.products.splice(index, 1));
      thisCart.update();

    }
    
  }
 
  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }
    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      // console.log(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      // console.log('new AmountWidget: ', thisCartProduct.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        // console.log(thisCartProduct.amount);
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        // console.log(thisCartProduct.price);
        thisCartProduct.dom.price.innerHTML =  thisCartProduct.price;
      }); 
    }
    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    initActions(){
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
        
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        // thisCartProduct.dom.wrapper.remove();
        thisCartProduct.remove();
      });
    }
  }
  const app = {
    initMenu: function(){
      const thisApp = this;

      //console.log('thisApp.data: ', thisApp.data);
      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },
    initData: function(){
      const thisApp = this;

      thisApp.data = dataSource;
    },
    init: function(){
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);
      thisApp.initData();
      this.initMenu();
      thisApp.initCart();
    },
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };
  

  app.init();
}