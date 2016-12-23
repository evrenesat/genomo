app.initialize();
var Client = {
    "portraitMargins": null,
    "landscapeMargins": null,
    'scan_cb': 'cb_open_admission',
    openURL: function (url) {
        Client.ifrm.attr('src', window._url.replace('/static', '') + url);
    },
    cb_open_admission: function (result) {
        Client.openURL('/admin/lab/admission/' + result + '/');
    },
    success: function (resultArray) {
        self = this;
        // alert("Scanned " + resultArray[0] + " code: " + resultArray[1]);
        result = parseInt(resultArray[0].toString().slice(0, -1));
        Client[Client.scan_cb](result);
        console.log(result);


    },

    failure: function (error) {
        alert("Failed: " + error);
    },

    scan: function () {
        self = this;
        // See below for all available options.
        cordova.exec(Client.success, Client.failure, "ScanditSDK", "scan",
            ["GBOP3HMlR83N8s1g5+mUvIClWEaEpUw9CyBhBpn7c/c",
                {
                    // "CameraFacing": 'FRONT',
                    // "preferFrontCamera": true,
                    "vibrate": false,
                    // "scanningHotSpot":"0/1",
                    // "scanningHotSpotHeight":"",
                    // "cameraSwitchVisibility": true,
                    // "cameraSwitchButtonPositionAndSize":"0.05/0.05/4/4" ,
                    "beep": true,
                    "code128": true,
                    "dataMatrix": false,
                    // "codeDuplicateFilter": 1500,
                    "continuousMode": true,
                    "portraitMargins": Client.portraitMargins,
                    "landscapeMargins": Client.landscapeMargins
                }]);
    },
    stop: function () {
        self = this;
        cordova.exec(null, null, "ScanditSDK", "stop", []);
        cordova.exec(null, null, "ScanditSDK", "resize",
            [{
                "portraitMargins": Client.portraitMargins,
                "landscapeMargins": Client.landscapeMargins,
                "animationDuration": 0.5,
                "viewfinderSize": "0.8/0.2/0.6/0.4"
            }]);
    },

    start: function () {
        self = this;
        cordova.exec(null, null, "ScanditSDK", "start", []);
        cordova.exec(null, null, "ScanditSDK", "resize",
            [{
                "portraitMargins": Client.portraitMargins,
                "landscapeMargins": Client.landscapeMargins,
                "animationDuration": 0.5,
                "viewfinderSize": "0.8/0.4/0.6/0.4"
            }]);
    },

    cancel: function () {
        self = this;
        cordova.exec(null, null, "ScanditSDK", "cancel", []);
    },


    onPause: function () {
        self = this;
        // Only stop the scanner under Android, under iOS it is automatically stopped.
        if (device.platform == "Android") {
            cordova.exec(null, null, "ScanditSDK", "stop", []);
        }
    },

    onResume: function () {
        self = this;
        // Only start the scanner under Android, under iOS it is automatically restarted.
        if (device.platform == "Android") {
            cordova.exec(null, null, "ScanditSDK", "start", []);
        }
    },

    go_fullscreen: function () {
        function log_event(val) {
            if (val) console.log(val)
        }

        AndroidFullScreen.immersiveMode(log_event, log_event);
    },
    exit_fullscreen: function () {
        function log_event(val) {
            if (val) console.log(val)
        }

        AndroidFullScreen.showSystemUI(log_event, log_event);
    },

    crosswalk_sidepanel_workaround: function () {
        // https://github.com/quark-dev/Phonon-Framework/issues/157

        var lastReload = parseInt(db.getItem('lastReload'));
        now = +new Date();
        if (!lastReload || (lastReload && now - lastReload > 5000)) {
            db.setItem('lastReload', now);
            window.location.reload();
        } else {
            db.setItem('lastReload', now);
        }
    }
};


function onDeviceReady() {
    window.db = window.localStorage;


    console.log('device ready');
    function successCallback(winSize) {
        console.log('size cb called');
        window.winSize = winSize;
        var _scan_top = winSize.height - 175;
        var _scan_left = winSize.width - 150;
        Client.portraitMargins = "0/" + _scan_top + "/" + _scan_left + "/0";
        Client.landscapeMargins = "0/" + _scan_top + "/" + _scan_left + "/0";
    }

    if (window.cordova) {
        Client.go_fullscreen();
        window.plugins.screensize.get(successCallback, successCallback);
        Client.scan();
        Client.crosswalk_sidepanel_workaround();
    }


    var TEMPL = {};
    phonon.options({
        navigator: {
            defaultPage: 'page3',
            animatePages: true,
            enableBrowserBackButton: true,
            templateRootDirectory: './tpl'
        },
        i18n: null // for this example, we do not use internationalization
    });


    var papp = phonon.navigator();
    papp.on({page: 'home', preventClose: false});
    papp.on({page: 'page3', preventClose: true})

    document.on('pageopened', function (event) {
        console.log('global state pagecreated: ' + event.detail.page)
        if (event.detail.page == 'p3') {
            $('p3 ul').append('<li><a class="padded-list" href="#!home">Zorta Zorta</a></li>');
        }
    });
    papp.on({page: 'p3', content: null});


    //    if(window.location.hash.indexOf('reloaded')==-1){
    //        window.location.href = window.location.href + "?reloaded=1#reloaded=1";
    //    }
    papp.start();


    phonon.sidePanel('#side-home').open();
    phonon.preloader('#loading').show();


    // Client.ifrm = $('#ifrm');

    // Since under Android the plugin is no longer in its own Activity we have to handle
    // the pause and resume lifecycle events ourselves.
    // $('#scan').on('touchstart', Client.scan);
    // $('#stop').on('touchstart', Client.stop);
    // $('#buttons').append($('<div>cancel</div>').click(function(){window.location.reload();}));
    // $('#buttons').append($('<button class="ui-btn">cancel</button>').on('touchstart', Client.cancel));
    // $('#buttons').append($('<button class="ui-btn">FULLSCREEN</button>').on('touchstart', Client.go_fullscreen));
    // $('button[value=reload]').click(function () {
    //     window.location.reload();
    // });

    // setTimeout(function(){
    //     $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', window._url+'/static/client.css') );
    // }, 2500);
    // setTimeout(function(){Client.openURL('/admin/');}, 1400);


    // alert('boo');
    // try {
    //     phonon.sidePanel('#side-home').open()
    // }catch(e){
    //     window.location.reload();
    // }

}

document.addEventListener("deviceready", onDeviceReady);

