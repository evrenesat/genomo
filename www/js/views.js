/**
 * Created by evren on 26/12/16.
 */
var TEMPLATES = {
    'admissions': '',
    'admission': '',
};

VIEWS = {
    new_patients: function (route) {

        var self = this;
        var url = window._url + '/lab/get_admissions_by_analyses/';
        $.get(url, {accepted: 'False'}, function (result) {
            Client.render_page('admissions', {items: result.admissions}, 'Yeni Gelenler');
        });
    },
    change_analyse_state: function (route) {

        var url = window._url + '/admin/lab/analyse/'+route.params[0]+'/change/#only_show_fieldset=admission_info,analyse_states';
        Client.show_iframe(url, route.params[1]);
    },
    enter_results: function (route) {

        var url = window._url + '/admin/lab/analyse/'+route.params[0]+'/change/#only_show_fieldset=admission_info,result_parameters,analyse_result';
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
        var url = window._url + '/lab/get_admission/' + route.params[0];
        Client.show_modal();
        $.get(url, function (result) {
            Client.fill_modal(TEMPLATES['admission'](result), result.patient_name);
        });
    },

}
