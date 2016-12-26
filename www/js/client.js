app.initialize();
var Client = {
    "portraitMargins": null,
    "landscapeMargins": null,
    'scan_cb': 'default_scan_action',
    default_scan_action: function(result){
        VIEWS.show_admission({params:[result]})
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
    },

    CONTENTIN: $('#contentin'),
    render_page: function (template, data, title) {
        console.log("set_page: " + template);
        content = TEMPLATES[template](data)
        if (title) {
            this.set_title(title);
        }
        this.CONTENTIN.html(content);
    },
    set_title: function (title) {
        $('#toolbar > h1').html(title);
    },

    MODAL: $('#myModal'),
    LOADING: '<div style="text-align:center"><img src="img/loading.gif" class="small_loading"></div>',
    IFRAME: '<iframe class="hidden-frame borderless"></iframe>',

    show_iframe: function (url, title) {
        if(title)this.set_title(title);
        var loading = $(this.LOADING).addClass('middle-center-top').css('left', (window.innerWidth / 2)-75 + 'px').css('top', (window.innerHeight / 2)-75 + 'px');
        Client.MODAL.modal('hide');
        this.close_sidemenu_if_not_locked();
        $('body').append(loading);
        var ifrm = $(Client.IFRAME).css('height',window.innerHeight-100+'px');
        Client.CONTENTIN.html('').append(
            ifrm.attr('src', url).on('load',function(){
                loading.remove();
                ifrm.css('opacity',1);
            })
        )
    },
    show_modal: function (content, title) {
        if (!content) content = this.LOADING;
        if (!title) title = '<div style="text-align:center">Yükleniyor</div>';
        if (!this.MODAL.length) this.MODAL = $('#myModal');
        this.MODAL.find('#myModalBody').html(content);
        this.MODAL.find('#myModalLabel').html(title);

        this.MODAL.modal('show');
        this.MODAL.on('hidden.bs.modal', function(){
            location.hash = '';
        });
    },
    fill_modal: function (content, title) {
        if (content) this.MODAL.find('#myModalBody').html(content);
        if (title) this.MODAL.find('#myModalLabel').html(title);
        this.MODAL.modal('handleUpdate');
    },
    MENU_LOCKED: false,
    close_sidemenu_if_not_locked: function(){
        if (!this.MENU_LOCKED) {
            Client.snapper.close();
        }
    },
    lock_sidemenu: function () {

        if (!this.MENU_LOCKED) {
            $('#lock-menu').addClass('selected');
            this.MENU_LOCKED = true;
            this.snapper.disable();
            $('#contentin').css('float', 'left').css('width', (window.innerWidth - 265).toString() + 'px');
        } else {
            $('#lock-menu').removeClass('selected');
            this.MENU_LOCKED = false;
            this.snapper.enable();
            this.snapper.close();
            $('#contentin').css('width', '').css('float', '');
        }
    },

    init_app: function () {

        var self = this;
        $('#contentin').css('width', window.innerWidth);

        self.snapper = new Snap({
            element: document.getElementById('content'),
            disable: 'right'
        });
        $('#lock-menu').on('tap', function () {
            self.lock_sidemenu();
        });
        $('#open-left').on('tap', function () {
            console.log('taptap')
            setTimeout("Client.snapper.open('left')",0);
        });

        $('#search_word, #search_num').on('focus', function () {
            self.snapper.expand('left');
        }).on('blur', function () {
            self.snapper.open('left');
        });

        for (var k of Object.keys(TEMPLATES)) {
            (function (page) {
                var url = self.root_url + 'tpl/' + page + '.html';
                $.get(url, function (result) {
                    TEMPLATES[page] = doT.template(result);
                })
            })(k)
        }

        function parse_hash() {
            var parts = location.hash.replace('#', '').split('/');
            if (parts.length) {
                var view = parts.splice(0, 1)[0];
                return {view: view, params: parts}
            } else {
                console.log('parse_hash error: no hash to parse')
            }


        }

        $(window).on('hashchange', function () {
            // route dynamic page calls to requested method
            console.log('hashchange event');
            // console.log(event);
            route = parse_hash();
            if (route && VIEWS[route.view]) {
                VIEWS[route.view](route);
            }
        }).trigger('hashchange');
        self.snapper.open('left');

    },
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

    Client.url = window._url;


    if (window.cordova) {
        Client.go_fullscreen();
        window.plugins.screensize.get(successCallback, successCallback);
        Client.scan();
        Client.crosswalk_sidepanel_workaround();
        Client.root_url = ''
    } else {
        Client.root_url = window._url + '/static/www/';
    }
    Client.init_app();


}

document.addEventListener("deviceready", onDeviceReady);

