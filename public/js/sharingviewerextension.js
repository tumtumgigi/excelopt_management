// *******************************************
// Sharing Viewer Extension
// *******************************************
function SharingViewer(viewer, options) {
    this.socket;
    this.lastSend = (new Date()).getTime();
    this.isPresenting = true;
    Autodesk.Viewing.Extension.call(this, viewer, options);
}

SharingViewer.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
SharingViewer.prototype.constructor = SharingViewer;

SharingViewer.prototype.load = function () {
    if (this.viewer.toolbar) {
        // Toolbar is already available, create the UI
        this.createUI();
    } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
        this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }
    return true;
};

SharingViewer.prototype.onToolbarCreated = function () {
    this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    this.onToolbarCreatedBinded = null;
    this.createUI();
};

SharingViewer.prototype.createUI = function () {
    var viewer = this.viewer;
    var _this = this;

    // button to show the docking panel
    var btnStartStopSharing = new Autodesk.Viewing.UI.Button('sharingViewerButton');
    btnStartStopSharing.onClick = function (e) {
        if (btnStartStopSharing.getState()) {
            // connect socket
            socket = io.connect(location.host);
            // join sharing room
            socket.on('newstate', function (data) { _this.onNewState(data) });

            // change toolbar
            btnStartStopSharing.removeClass('sharingViewerButtonJoin');
            btnStartStopSharing.addClass('sharingViewerButtonExit');
            btnStartStopSharing.setToolTip('Leave Sharing Viewer');
            btnStartStopSharing.setState(0)
            _this.joinSharing();
        }
        else {
            // leave sharing room
            _this.leaveSharing();
            // disconnect
            socket.disconnect();

            // change toolbar
            btnStartStopSharing.removeClass('sharingViewerButtonExit');
            btnStartStopSharing.addClass('sharingViewerButtonJoin');
            btnStartStopSharing.setToolTip('Join Sharing Viewer');
            btnStartStopSharing.setState(1)
        }
    };
    // myAwesomeToolbarButton CSS class should be defined on your .css file
    btnStartStopSharing.addClass('sharingViewerButton');
    btnStartStopSharing.addClass('sharingViewerButtonJoin');
    btnStartStopSharing.setToolTip('Join Sharing Viewer');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('sharingViewer');
    this.subToolbar.addControl(btnStartStopSharing);

    viewer.toolbar.addControl(this.subToolbar);
};

SharingViewer.prototype.leaveSharing = function () {
    socket.emit('leave', {
        modelView: viewerApp.myCurrentViewer.model.getData().basePath
    });
};

SharingViewer.prototype.joinSharing = function () {
    socket.emit('join', {
        modelView: viewerApp.myCurrentViewer.model.getData().basePath
    });

    var _this = this;
    document.getElementById('forgeViewer').addEventListener('click', function (event) {
        console.log('taking control')
        _this.isPresenting = true;
    });

    var viewer = this.viewer;
    var _this = this;

    viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, function () { _this.onStateChanged() });
    viewer.addEventListener(Autodesk.Viewing.EXPLODE_CHANGE_EVENT, function () { _this.onStateChanged() });
    viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, function () { _this.onStateChanged() });
    viewer.addEventListener(Autodesk.Viewing.CUTPLANES_CHANGE_EVENT, function () { _this.onStateChanged() });
    viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, function () { _this.onStateChanged() });
    viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, function () { _this.onStateChanged() });
    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function () { _this.onStateChanged() });
}

SharingViewer.prototype.onStateChanged = function (e) {
    if (!this.isPresenting) return;
    // this 200 ms latency should reduce traffic, but still good
    if (this.lastSend + 200 > (new Date()).getTime()) return;
    this.lastSend = (new Date()).getTime();

    console.log('sending new state...');
    socket.emit('statechanged', {
        modelView: this.viewer.model.getData().basePath,
        state: this.viewer.getState()
    });
}

SharingViewer.prototype.onNewState = function (data) {
    this.isPresenting = false; // now this browser is just watching
    console.log('receiving new state...');
    viewerApp.myCurrentViewer.restoreState(data, null, false);
}

SharingViewer.prototype.unload = function () {
    this.viewer.toolbar.removeControl(this.subToolbar);
    socket.disconnect();
    return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('SharingViewer', SharingViewer);