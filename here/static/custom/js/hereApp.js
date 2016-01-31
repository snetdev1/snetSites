var coreApp = angular.module('coreApp', ['ngRoute', 'ngCookies', 'ngResource', 'ngStorage', 'ngMap'], function ($httpProvider) {
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */

    var param = function (obj) {
        var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            value = obj[name];

            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + '[' + i + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            }
            else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            }
            else if (value !== undefined && value !== null)
                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }

        return query.length ? query.substr(0, query.length - 1) : query;
    };
    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function (data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
})


    .config(['$routeProvider', '$httpProvider',
        function ($routeProvider, $httpProvider) {
            $routeProvider.

                when('/', {
                    templateUrl: 'home.html',
                    controller: 'homeCtrl'
                }).when('/find', {
                    templateUrl: 'find.html',
                    controller: 'findCtrl'
                }).when('/create', {
                    templateUrl: 'create.html',
                    controller: 'createCtrl'
                }).when('/addll/:addressID?', {
                    templateUrl: 'addLL.html',
                    controller: 'addLLCtrl'
                })
                .when('/test', {
                    templateUrl: 'test.html',
                    controller: 'testCtrl'
                })


                .when('/testmap', {
                    templateUrl: 'ngmap2.html',
                    controller: 'LayerKmlFeaturesCtrl'
                }).when('/:stateID', {
                    templateUrl: 'ngmap3.html',
                    controller: 'showCountiesCtrl'
                }).when('/:stateID/:countyID', {
                    templateUrl: 'ngmap3.html',
                    controller: 'showPrecinctsCtrl'
                })
                .when('/:stateID/:countyID/:precinctID', {
                    templateUrl: 'ngmap3.html',
                    controller: 'showAddressesCtrl'
                }).when('/:stateID/:countyID/:precinctID/:addressID', {
                    templateUrl: 'votersPerAddress.html',
                    controller: 'showVotersCtrl'
                })
                .otherwise({
                    redirectTo: '/35'
                });
            $httpProvider.defaults.xsrfCookieName = 'csrftoken';
            $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
            $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        }
    ])

    //SET CSRF TOKEN WHEN MODULE RUNS; THIS IS REQUIRED TO POST FORM DATA; ELSE SERVICE RETURNS 403
    //COOKIE CSRF TOKEN PROVIDED BY VALID LOGIN PAGE AUTHENTICATION AND EXPIRES WHEN BROWSER CLOSES

    .run(function ($http, $cookies) {
        $http.defaults.headers.post['X-CSRFToken'] = $cookies['csrftoken'];

    });


coreApp
    .factory('simpleSearch', function ($resource) {
        return $resource('/data/vote/voter/search/:lastName/:firstName/', {
            'query': {method: 'GET', isArray: false},
            'get': {method: 'get', isArray: false}
        });


    })
    .factory('latLngAddressLookup', function ($resource) {
        return $resource('https://maps.googleapis.com/maps/api/geocode/json?latlng=:latLng')
    });

coreApp.controller('basicCtrl', ['$scope', function ($scope) {

        $scope.messages = {
            welcome: "Welcome"
        };

    }]).controller('templateCtrl', ['$scope', function ($scope) {
        $scope.templates =
            [
                { name: 'navTemplate', url: 'nav.html'}

            ];
        $scope.navTemplate = $scope.templates[0];

    }]).controller('testCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
        $scope.messages = {
            welcome: "Welcome to the test"
        };


    }]).controller('findCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
        $scope.messages = {
            welcome: "Welcome to the search page"
        };
        var vm = this;
        vm.message = 'You can not hide. :)';
        vm.callbackFunc = function (param) {
            console.log('I know where ' + param + ' are. ' + vm.message);
            console.log('You are at' + vm.map.getCenter());
        };


    }]).controller('homeCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
        $scope.messages = {
            welcome: "Welcome to the test"
        };


    }]).controller('createCtrl', ['$scope', 'latLngAddressLookup', function ($scope, latLngAddressLookup) {

        $scope.messages = {
            welcome: "create a new thing!"


        };

        var vm = this;
        vm.message = 'You can not hide. :)';
        vm.callbackFunc = function (param) {
            console.log('I know where ' + param + ' are. ' + vm.message);
            console.log('You are at' + vm.map.getCenter());
        };

        $scope.addressSource = {
            currentLocation: true,
            html5found: false

        }
        $scope.findMe = function (indicatorStatus) {
            if (indicatorStatus==true) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        var pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }

                        $scope.addressSource.currentLocation = true
                        console.log(pos.lat + " " + pos.lng)
                        var testGet = latLngAddressLookup.query({latLng: pos.lat + "," + pos.lng})
                        console.log(testGet)


                    })
                } else {
                    $scope.addressSource.currentLocation = false


                }
            } else {
                console.log('other status line 200')
            }
        }

        vm.positions = [];
        vm.addMarker = function(event) {
            vm.positions = [];
        var ll = event.latLng;
        vm.positions.push({lat:ll.lat(), lng: ll.lng()});
      }
    }]);


function findMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }

            console.log(pos.lat + " " + pos.lng)


        })
    }

}