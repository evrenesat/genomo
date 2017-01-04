/**
 * Created by evren on 26/12/16.
 */

VIEWS = {
    ANALYSE_TYPES: null,
    select_analyse_type: function () {
        console.log('select_analyse_type')
        if (!VIEWS.ANALYSE_TYPES) { // allow preloader to load the data
            setTimeout(VIEWS.select_analyse_type, 1000);
        } else {
            Client.render_page('change_analyse_state', VIEWS.ANALYSE_TYPES, 'Hızlı Test Durumu Güncelle');
        }
    },
    change_analyse_state: function (route) {
        var self = this;
        var url = window._url + '/lab/api/list_analyse_type_states/' + route.params[0];

        $.get(url, {}, function (result) {
            result.analyse_types = self.ANALYSE_TYPES.analyse_types
            self.SELECTED_ANALYSE_TYPE = result.selected_analyse_type_id = parseInt(route.params[0]);
            self.SELECTED_STATE = result.selected_state_id = parseInt(route.params[1]);
            self.REQ_DOUBLE_CHECK = result.require_double_check = parseInt(route.params[2]);
            Client.render_page('change_analyse_state', result, 'Hızlı Test Durumu Güncelle');
        });
    },
    STATE_SESSION: false,
    handle_analyse_state_session: function () {
        if (document.getElementById('analyse_state_session_switch').checked) {

            this.STATE_SESSION = true;
            try {
                Client.scan();
            } catch (e) {
            }
        } else {
            this.STATE_SESSION = false;
        }
    },
    SELECTED_ANALYSE_TYPE: null,
    SELECTED_STATE: null,
    CURRENT_BARCODES: [],
    CURRENT_ADMISSION: null,
    CURRENT_ANALYSE: null,
    set_states_by_barcode_double: function (route) {
        var self = this;
        type = route.params[0];
        pk = route.params[1];
        group = route.params[2];
        var admission_url = window._url + '/lab/api/get_admission/' + pk;
        var analyse_url = window._url + '/lab/api/get_analyse/' + pk;
        Client.show_modal();

        if (type == 'pro') {
            $.get(admission_url, function (result) {
                self.CURRENT_ADMISSION = result.admission = result;
                result.analyse = self.CURRENT_ANALYSE;
                Client.fill_modal(TEMPLATES['barcode_check'](result), result.patient_name);
                self.check_if_barcodes_match();
            });
        } else {
            if (self.CURRENT_ANALYSE) {

                var result = {analyse: self.CURRENT_ANALYSE};
                if (self.CURRENT_ANALYSE.id == pk && group == self.CURRENT_ANALYSE.group) {
                    result.analyse2 = result.analyse;
                    result.analyse2.group = group;

                    self.do_barcodes_match();
                } else {
                    self.do_barcodes_error();
                }
                Client.fill_modal(TEMPLATES['barcode_check'](result));

            } else {
                $.get(analyse_url, function (result) {
                    self.CURRENT_ANALYSE = result.analyse = result;
                    self.CURRENT_ANALYSE.group = group;
                    result.admission = self.CURRENT_ADMISSION;
                    Client.fill_modal(TEMPLATES['barcode_check'](result), result.patient_name);
                    self.check_if_barcodes_match();
                });
            }

        }


    },
    set_states_by_barcode: function (route) {
        var self = this;
        type = route.params[0];
        pk = route.params[1];
        group = route.params[2];
        var admission_url = window._url + '/lab/api/get_admission/' + pk;
        var analyse_url = window._url + '/lab/api/get_analyse/' + pk;
        // Client.show_modal();

        if (type == 'pro') {
            self.save_analyse_state({
                admission: pk,
                analyse_type: self.SELECTED_ANALYSE_TYPE,
                state_definition: this.SELECTED_STATE
            })
        } else {
            self.save_analyse_state({
                analyse: pk,
                analyse_type: self.SELECTED_ANALYSE_TYPE,
                state_definition: this.SELECTED_STATE,
                group: group
            });
        }
    },
    set_states_by_hand: function (route) {
        pk = route.params[0];
        selected_definition_id = route.params[1] || 0;
        var url = window._url + '/lab/api/get_analyse/' + pk;
        Client.show_modal();
        $.get(url, {add_type_states: 1, selected_definition_id: selected_definition_id},
            function (result) {
                if (route.context) {
                    Object.assign(result, route.context);
                    console.log(result);
                }
                result.selected_definition_id = selected_definition_id;
                Client.fill_modal(TEMPLATES['change_selected_analyse_state'](result), result.patient_name);
            });

    },
    check_if_barcodes_match: function () {
        if (this.CURRENT_ADMISSION && this.CURRENT_ANALYSE) {
            if (this.CURRENT_ADMISSION.id == this.CURRENT_ANALYSE.admission_id) {
                this.do_barcodes_match();
            } else {
                this.do_barcodes_error();
            }
        }
    },
    do_barcodes_error: function () {
        console.log('ERROR, codes DO NOT match!!!');
        this.CURRENT_ADMISSION = null;
        this.CURRENT_ANALYSE = null;


    },

    do_barcodes_match: function () {
        console.log('SUCCESS, codes match :)');
        this.save_analyse_state({
            analyse: this.CURRENT_ANALYSE.id,
            analyse_type: self.SELECTED_ANALYSE_TYPE,
            state_definition: this.SELECTED_STATE
        });
        this.CURRENT_ADMISSION = null;
        this.CURRENT_ANALYSE = null;

    },
    save_analyse_state: function (params) {

        var self = this;
        var url = window._url + '/lab/api/set_analyse_state/';
        $.post(url, params, function (result) {
            if (result.result == 'Success') {
                console.log('SAVED', result);
                self.show_analyse({params: [result.analyse_id], context: result});

            } else {
                alert(result.error);
                console.log('Error', result);
            }
        })
    },
    change_analyse_state_admin: function (route) {

        var url = window._url + '/admin/lab/analyse/' + route.params[0] + '/change/#only_show_fieldset=admission_info,analyse_states';
        Client.show_iframe(url, route.params[1]);
    },
    new_patients: function (route) {

        var self = this;
        var url = window._url + '/lab/get_admissions_by_analyses/';
        $.get(url, {accepted: 'False'}, function (result) {
            Client.render_page('admissions', {items: result.admissions}, 'Yeni Gelenler');
        });
    },
    admission_search: function (route) {

        var self = this;
        var url = window._url + '/lab/api/get_admissions/';
        data = {}
        data[route.params[0]] = route.params[1]
        $.get(url, data, function (result) {
            Client.render_page('admissions', result, 'Arama Sonuçları');
        });
    },
    scan_handler: function (route) {
        if (this.STATE_SESSION) {
            if (this.REQ_DOUBLE_CHECK) {
                this.set_states_by_barcode_double(route)
            } else {
                this.set_states_by_barcode(route)
            }
        }
        else this.show_admission_or_analyse(route)
    },
    show_admission_or_analyse: function (route) {
        console.log(route.params);
        var barcode_view_map = {lab: this.show_analyse, pro: this.show_admission};
        barcode_view_map[route.params[0]]({params: [route.params[1]]});
    },
    enter_results: function (route) {

        var url = window._url + '/admin/lab/analyse/' + route.params[0] + '/change/#only_show_fieldset=admission_info,result_parameters,analyse_result';
        Client.show_iframe(url, route.params[1]);
    },
    harvest_state: function (route) {
        var url = window._url + '/admin/lab/state/?current_state__exact=1&definition__id__exact=10&sample_type__in=3,4,6#hide_header=1';
        Client.show_iframe(url, route.params[1]);
    },
    seed_state: function (route) {
        var url = window._url + '/admin/lab/state/?current_state__exact=1&definition__id__exact=9&sample_type__in=3,4,6#hide_header=1';
        Client.show_iframe(url, route.params[1]);
    },
    list_states: function (route) {
        var url = window._url + '/admin/lab/state/?current_state__exact=1#hide_header=1';
        Client.show_iframe(url, route.params[1]);
    },
    show_admission: function (route) {

        var self = this;
        console.log(route);
        var url = window._url + '/lab/api/get_admission/' + route.params[0];
        Client.show_modal();
        $.get(url, function (result) {
            Client.fill_modal(TEMPLATES['admission'](result), result.patient_name);
        });
    },
    show_analyse: function (route) {

        var self = this;
        console.log(route);
        var url = window._url + '/lab/api/get_analyse/' + route.params[0];
        Client.show_modal();
        $.get(url, function (result) {
            if (route.context) {
                Object.assign(result, route.context);
                console.log(result);
            }

            Client.fill_modal(TEMPLATES['analyse'](result), result.patient_name);
        });
    },
    dashboard:function(){
        if(!Client.LOGIN)return;
        Client.render_page('dashboard', {}, 'Anlık Durum');
        var data = {
          labels: ['Bananas', 'Apples', 'Grapes'],
          series: [20, 15, 40]
        };
        new Chartist.Pie('#chart1', data);
    },

}
