var DEBUG = false;
var DEBUG = 1;
app.initialize();
function wiew(view, params, options) {
    if (options) {
        if (options.modal == 'close') Client.MODAL.modal('hide');
    }
    params = params || [];
    location.hash = view + '/' + params.join('/');
}
jQuery.fn.scrollTo = function (elem) {
    var b = $(elem);
    this.scrollTop(b.position().top + b.height() - this.height());
};
var TEMPLATES = {
    'admissions': '',
    'admission': '',
    'analyse': '',
    'menu': '',
    'change_analyse_state': '',
    'barcode_check': '',
    'change_selected_analyse_state': '',
    'dashboard': '',
};

function create_selectbox(optionList, appendTo, selections, is_multiple) {
    var combo = $("<select class='comboin'></select>");
    if (is_multiple) {
        combo.attr('multiple', 'multiple');
    }
    combo.append($("<option value=''> --- </option>"));
    $.each(optionList, function (i, el) {
        var option = $("<option>" + el + "</option>");
        if (selections.indexOf(el) > -1) {
            option.attr('selected', true);
        }
        combo.append(option);
    });
    // $(combo).change(function () {
    //     console.log("Change", toElem);
    //     toElem.val(is_multiple ? combo.val().join(',') : combo.val());
    // });
    if (appendTo) {
        $(appendTo).html(combo)
    }
    return combo;
}

var Client = {
    "portraitMargins": null,
    "landscapeMargins": null,
    'scan_cb': 'default_scan_action',
    default_scan_action: function (result) {
        VIEWS.scan_handler({params: result})
    },
    success: function (resultArray) {
        self = this;
        // alert("Scanned " + resultArray[0] + " code: " + resultArray[1]);
        result = resultArray[0].toString().slice(0, -1);

        if (result[0] == '9') {
            // "lab" means this is an analyse barcode

            result = ['lab', parseInt(result.slice(2)), parseInt(result[1])];
        } else {
            // "pro" means this is an admission barcode (PROtocol number)
            result = ['pro', parseInt(result)];
        }
        Client[Client.scan_cb](result);
        console.log(result);


    },

    failure: function (error) {
        alert("Failed: " + error);
    },

    scan: function () {
        $('#camera-menu').addClass('activated');
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
                    "codeDuplicateFilter": 1000,
                    "continuousMode": true,
                    "portraitMargins": Client.portraitMargins,
                    "landscapeMargins": Client.landscapeMargins
                }]);
        $('#camera-menu').removeClass('activated').addClass('selected');
    },


    cancel: function () {
        $('#camera-menu').addClass('activated');
        self = this;
        cordova.exec(null, null, "ScanditSDK", "cancel", []);
        $('#camera-menu').removeClass('selected').removeClass('activated');
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

    CONTENTIN: $('#contentin'),
    render_page: function (template, data, title) {
        console.log("render_page with data: " + template);
        console.log(data);
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
        var self = this;
        this.set_title(title || '');
        var loading = $(this.LOADING).addClass('middle-center-top').css('left', (window.innerWidth / 2) - 75 + 'px').css('top', (window.innerHeight / 2) - 75 + 'px');
        Client.MODAL.modal('hide');
        this.close_sidemenu_if_not_locked();
        $('body').append(loading);
        var ifrm = $(Client.IFRAME).css('height', window.innerHeight - 100 + 'px');
        Client.CONTENTIN.html('').append(
            ifrm.attr('src', url).on('load', function () {
                ifrm.contents().find("head").append($("<link/>",
                    {
                        rel: "stylesheet",
                        href: self.url + "/static/mobilize.css",
                        type: "text/css"
                    }));
                loading.remove();
                ifrm.css('display', 'block');
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
        this.MODAL.on('hidden.bs.modal', function () {
            location.hash = '';
        });
    },
    fill_modal: function (content, title) {
        if (content) this.MODAL.find('#myModalBody').html(content);
        if (title) this.MODAL.find('#myModalLabel').html(title);
        this.MODAL.modal('handleUpdate');
    },
    MENU_LOCKED: false,
    close_sidemenu_if_not_locked: function () {
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
    MENU_CONTAINER: $('div#snap-drawer-left'),
    load_menu_content: function () {
        var self = this;
        this.MENU_CONTAINER.html(TEMPLATES['menu']());
        ////// Bind Search boxes ////////////////////////////
        $('#search_test_no').on('keydown', function (ev) {
            if (ev.keyCode == 9 || ev.keyCode == 13) {
                wiew('show_analyse', [$('#search_test_no').val()])
            }
        });
        $('#search_admission_no').on('keydown', function (ev) {
            if (ev.keyCode == 9 || ev.keyCode == 13) {
                wiew('admission_search', ['by_no', $('#search_admission_no').val()])
            }
        });
        $('#search_admission').on('keydown', function (ev) {
            if (ev.keyCode == 9 || ev.keyCode == 13) {
                wiew('admission_search', ['by_word', $('#search_admission').val()])
            }
        });


        var cambtn = $('<button id="camera-menu" class="glyphicon glyphicon-camera"/>');

        // barcode scanner open/close button
        cambtn.on('tap', function () {
            if (cambtn.hasClass('selected')) {
                self.cancel();
            } else {
                self.scan();
            }
        });
        $('div.snap-drawer.snap-drawer-left').append(cambtn);


    },
    load_templates: function () {
        var self = this;
        // debugger;
        for (var k of Object.keys(TEMPLATES)) {
            (function (page) {
                var url = self.root_url + 'tpl/' + page + '.html?_rnd=' + SESS_RAND;
                $.get(url, function (result) {
                    TEMPLATES[page] = doT.template(result);
                    $(self).trigger(page + '_template_loaded');
                })
            })(k)
        }
    },
    preload_data: function () {
        $.get(window._url + '/lab/api/list_analyse_types/', {}, function (result) {
            VIEWS.ANALYSE_TYPES = result;
        });
    },
    change_user: function () {
        var url = window._url + '/lab/api/switch_user/',
            username = $('div#userbox > select').val();
        if (username == '_exit_') {
            Client.logout_user();
            return;
        } else if (username) {
            $.get(url, {username: username}, function (result) {
                if (result.result == 'success') {
                    alert('Etkin kullanıcı değiştirildi: ' + username);
                }
            });
        }

    },
    LOGIN: false,
    create_user_menu(){
        var self = this;
        var url = window._url + '/lab/api/get_user_info/';
        $.get(url, function (result) {
            if (result.toString().indexOf('password') > 0) {
                Client.show_iframe(window._url);
                self.LOGIN = false;
            } else {
                var combo = create_selectbox(result.other_users, '#userbox', [result.username])
                combo.on('change', self.change_user);
                combo.append('<option value="">---</option><option value="_exit_">Çıkış Yap</option>');
                self.LOGIN = true;
            }
        });
    },
    logout_user(){
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            Client.show_iframe(window._url + '/admin/logout/');
        }
    },
    init_app: function () {
        var self = this;
        $(this).on('menu_template_loaded', this.load_menu_content);
        $(this).on('dashboard_template_loaded', function () {
            if(!DEBUG)wiew('dashboard')
        });
        this.load_templates();
        this.create_user_menu();


        $('#contentin').css('width', window.innerWidth);

        // init sidemenu
        self.snapper = new Snap({
            element: document.getElementById('content'),
            disable: 'right'
        });

        // lock menu button
        $('#lock-menu').on('tap', function () {
            self.lock_sidemenu();
        });
        // menu open button
        $('#open-left').on('tap', function () {
            setTimeout("Client.snapper.open('left')", 0);
        });

        // $('#search_word, #search_num').on('focus', function () {
        //     self.snapper.expand('left');
        // }).on('blur', function () {
        //     self.snapper.open('left');
        // });


        ////////// route hash changes to view methods /////////////////
        function parse_hash() {
            var parts = location.hash.replace('#', '').split('/');
            if (parts.length) {
                var view = parts.splice(0, 1)[0];
                return {view: view, params: parts}
            } else {
                console.log('parse_hash error: no hash to parse')
            }


        }
        console.log("bind to hashchange");
        $(window).on('hashchange', function () {
            // route dynamic page calls to requested method
            console.log('hashchange event');
            // console.log(event);
            route = parse_hash();
            if (route && VIEWS[route.view]) {
                $('img.small_loading').remove();
                VIEWS[route.view](route);
            }
        })
        setTimeout("$(window).trigger('hashchange')", 1500);
        ////////////////////////////////////////////////////////////////


        ////////////////////////////////////////////////////////////////

        // open sidemenu on page load
        // self.snapper.open('left');

    },
};


function onDeviceReady() {

    window.SESS_RAND = Math.random().toString(36).substring(7);
    $(document).ajaxError(function () {
        console.log(arguments)
    });


    console.log('device ready');
    function successCallback(winSize) {
        console.log('size cb called');
        window.winSize = winSize;
        var _scan_top = window.innerHeight - 175;
        var _scan_left = window.innerWidth - 150;
        Client.portraitMargins = "0/" + _scan_top + "/" + _scan_left + "/0";
        Client.landscapeMargins = "0/" + _scan_top + "/" + _scan_left + "/0";
    }

    var _scan_top = window.innerHeight - 175;
    var _scan_left = window.innerWidth - 150;
    Client.portraitMargins = "0/" + _scan_top + "/" + _scan_left + "/0";
    Client.landscapeMargins = "0/" + _scan_top + "/" + _scan_left + "/0";

    Client.url = window._url;


    if (window.cordova) {
        Client.go_fullscreen();
        window.plugins.screensize.get(successCallback, successCallback);
        Client.scan();
        // Client.root_url = '';
        Client.root_url = window._url + '/static/www/';
    } else {
        Client.root_url = window._url + '/static/www/';
    }
    if(window.dev_ready_processed)return;
    Client.preload_data();

    window.dev_ready_processed = true;
    Client.init_app();


}

document.addEventListener("deviceready", onDeviceReady);



