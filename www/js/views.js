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
            self.SELECTED_STATE = parseInt(route.params[1] || 0);
            result.selected_state_id = parseInt(route.params[1] || 0);
            self.REQ_DOUBLE_CHECK = result.require_double_check = parseInt(route.params[2]);
            Client.render_page('change_analyse_state', result, 'Hızlı Test Durumu Güncelle');
            $('div#analysetypes').scrollTo('a[data-oid=' + self.SELECTED_ANALYSE_TYPE + ']');
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
    SELECTED_STATE: 0,
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
                var curr_anl_copy = $.extend(true, {}, self.CURRENT_ANALYSE);
                var result = {analyse: self.CURRENT_ANALYSE};
                if (self.CURRENT_ANALYSE.id == pk && group == self.CURRENT_ANALYSE.group) {
                    self.do_barcodes_match();
                } else {
                    result.error = true;
                    result.analyse2 = null;
                    self.do_barcodes_error();
                }
                result.analyse2 = curr_anl_copy;
                result.analyse2.group = group;
                console.log(result.analyse.group);
                // console.log(result.analyse2.group);
                Client.fill_modal(TEMPLATES['barcode_check'](result));

            } else {
                $.get(analyse_url, function (result) {
                    var aresult = jQuery.extend(true, {}, result);
                    result.analyse = aresult;
                    self.CURRENT_ANALYSE = aresult;
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
    raw_edit: function (route) {

        var url = window._url + '/admin/lab/analyse/' + route.params[0] + '/change/#only_show_fieldset=admission_info';
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
        var barcode_view_map = {lab: this.show_analyse, pro: this.show_admission};
        barcode_view_map[route.params[0]]({params: [route.params[1]]});
    },
    enter_results: function (route) {

        var url = window._url + '/admin/lab/analyse/' + route.params[0] + '/change/#only_show_fieldset=admission_info,result_parameters,analyse_result';
        Client.show_iframe(url, route.params[1]);
    },
    enter_panel_results: function (route) {

        var url = window._url + '/admin/lab/parametervalue/?q=' + route.params[0] + '#pop_up=1';
        Client.show_iframe(url, route.params[1]);
    },
    show_panel_report: function (route) {

        var url = window._url + '/lab/report_for_panel_grouper/' + route.params[0] + '/';
        Client.show_iframe(url, route.params[1]);
    },
    show_report: function (route) {

        var url = window._url + '/lab/analyse_report/' + route.params[0] + '/#noprint';
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
        var url = window._url + '/lab/api/get_admission/' + route.params[0];
        Client.show_modal();
        $.get(url, function (result) {
            Client.fill_modal(TEMPLATES['admission'](result), result.patient_name);
        });
    },
    show_analyse: function (route) {
        var self = this;
        var url = window._url + '/lab/api/get_analyse/' + route.params[0];
        Client.show_modal();
        $.get(url, function (result) {
            if (route.context) {
                Object.assign(result, route.context);
            }

            Client.fill_modal(TEMPLATES['analyse'](result), result.patient_name);
        });
    },
    process_timeseries: function(data){
        var result = {labels: [], series: []};
        series = []
        for (var k of data) {
            result.labels.push(k[0]);
            series.push(k[1]);
        }
        result.series.push(series);
        return result

    },
    process_tuple_list: function (data) {
        var result = {labels: [], series: []};
        var total = 0;
        var series = [];
        for (var k of data) {
            result.labels.push(k[0].substring(0,15));
            series.push(k[1]);
            total += k[1];
        }
        for (var v of series){
            result.series.push(parseInt(v * 100 / total));
        }
        // result.series = series;
        return result
    },

    createChart: function (_id, data, title, chartType, respOptions, processor) {
        // var data = {
        //   labels: ['Bananas', 'Apples', 'Grapes'],
        //   series: [20, 15, 40]
        // };
        var self = this;
        chartType = chartType || 'Pie';
        processor = processor || self.process_tuple_list;
        if(chartType == 'Bar'){
            $('#'+_id).removeClass('col-md-6').addClass('col-md-12');
        }
        // var _id = Math.random().toString(36).substring(7);
        // $('content#dashboard').append('<div id="'+_id+'" class="chart-holder col-md-6"></div>');
        var responsiveOptions = respOptions || [
                ['screen and (min-width: 640px)', {
                    // chartPadding: 40,
                    labelOffset: 110,
                    labelDirection: 'explode',
                    labelInterpolationFnc: function (value) {
                        return value;
                    }
                }],
                ['screen and (min-width: 1024px)', {
                    labelOffset: 100,
                    // chartPadding: 30,
                    labelDirection: 'explode',
                }]
            ];
        new Chartist[chartType]('div#'+_id+'>div', processor(data), null, responsiveOptions);
        // setTimeout(function(){new Chartist[chartType]('div#'+_id, self.process_tuple_list(data), null, responsiveOptions);},0);
        $('div#'+_id+' h3').remove();
        $('div#'+_id).prepend($('<h3></h3>').html(title)).addClass('shownChart');
        console.log("render chart", title);
    },

    dashboard: function () {

        var self = this;
        if (!Client.LOGIN)return;
        var url = window._url + '/lab/api/dashboard_stats/';
        Client.render_page('dashboard', {}, 'Anlık Durum');


        $.get(url, function (result) {
            for(var key of result.chart_list) {
                var id = 'chart'+result.chart_list.indexOf(key);
                if (key =='Günlük Toplamlar'){
                    self.createChart(id, result[key].data, key, result[key].type, {}, self.process_timeseries);

                }else {
                    self.createChart(id, result[key].data, key, result[key].type);
                }
            }
        })

    },

}
