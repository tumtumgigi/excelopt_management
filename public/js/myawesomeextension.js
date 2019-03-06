// *******************************************
// My Awesome Extension
// *******************************************

// Inherit the new extension via Autodesk.Viewing.Extension and .call js
function MyAwesomeExtension(viewer, options) {
  Autodesk.Viewing.Extension.call(this, viewer, options);
}

// Create a new object via the top of prototype inheritance 
// and add a constructor to the object (our extension)
MyAwesomeExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
MyAwesomeExtension.prototype.constructor = MyAwesomeExtension;

// Overide the load method to add functionality to the viewer. Use the Viewer's APIs
// to add/modify/replace/delete UI, register event listener, etc.
MyAwesomeExtension.prototype.load = function () {
  if (this.viewer.toolbar) {
    // Toolbar is already available, create the UI
    this.createUI();
  } else {
    // Toolbar hasn't been created yet, wait until we get notification of its creation
    this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
  }
  return true; // Return true if successful
};

// Create the onToolbarCreated method for ext. object
MyAwesomeExtension.prototype.onToolbarCreated = function () {
  this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
  this.onToolbarCreatedBinded = null;
  this.createUI();
};

MyAwesomeExtension.prototype.createUI = function () {
  var _this = this;

  // prepare to execute the button action
  var myAwesomeToolbarButton = new Autodesk.Viewing.UI.Button('runMyAwesomeCode');
  myAwesomeToolbarButton.onClick = function (e) {

    // **********************
    //
    //
    // Execute an action here
    //
    //
    // **********************

    alert('I am an extension');

  };
  // myAwesomeToolbarButton CSS class should be defined on your .css file
  // you may include icons, below is a sample class:
  myAwesomeToolbarButton.addClass('myAwesomeToolbarButton');
  myAwesomeToolbarButton.setToolTip('My Awesome extension');

  // SubToolbar
  this.subToolbar = (this.viewer.toolbar.getControl("MyAppToolbar") ?
    this.viewer.toolbar.getControl("MyAppToolbar") :
    new Autodesk.Viewing.UI.ControlGroup('MyAppToolbar'));
  this.subToolbar.addControl(myAwesomeToolbarButton);

  this.viewer.toolbar.addControl(this.subToolbar);
};

MyAwesomeExtension.prototype.unload = function () {
  this.viewer.toolbar.removeControl(this.subToolbar);
  return true;
};

// Registering the extension
// Autodesk.Viewing.theExtensionManager.registerExtension('your_extension_id,
// Autodesk.Viewing.Extension.<your_extension_class>);
// Extension are registered and loaded automatically by adding the Extension ID to the config object
// passed to the viewer constructor.
Autodesk.Viewing.theExtensionManager.registerExtension('MyAwesomeExtension', MyAwesomeExtension);