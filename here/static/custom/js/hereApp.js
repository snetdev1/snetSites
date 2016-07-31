function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var coreApp = angular.module('coreApp', ['ngRoute', 'ngCookies', 'ngResource', 'ngStorage', 'ngMap', 'restangular'], function ($httpProvider) {
    console.log('starting')
    // Use x-www-form-urlencoded Content-Type
    //$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}


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
    }];*/
})


    .config(['$routeProvider', '$httpProvider',
        function ($routeProvider, $httpProvider) {
            console.log('configuring')
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

    .run(function ($rootScope, $location, $http, $cookies) {
        console.log('running')
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        $rootScope.$watch(function () {
                return $location.path();
            },
            function (a) {

                fullPath = $location.path();

            });
    });


coreApp
    .factory('userDetails', function ($resource, $location) {
        return $resource('/x/u', {
            'query': {method: 'GET', isArray: false }
        });
    })

    .factory('partyPoster', function ($http) {
        return{addNew: function (partyData) {
            $http.post("/x/here/parties/", partyData)
                .success(function (data) {
                    console.log('success' + data)
                }).error(function (data) {
                    console.log('fail' + data)
                });
        }}
    })

    .factory('Facebook',
        ["$q", "$window", "$rootScope",
            function ($q, $window, $rootScope) {

                // since we are resolving a thirdparty response,
                // we need to do so in $apply
                var resolve = function (errval, retval, deferred) {
                    $rootScope.$apply(function () {
                        if (errval) {
                            deferred.reject(errval);
                        } else {
                            retval.connected = true;
                            deferred.resolve(retval);
                        }
                    });
                }

                var _login = function () {
                    var deferred = $q.defer();
                    //first check if we already have logged in
                    FB.getLoginStatus(function (response) {
                        if (response.status === 'connected') {
                            // the user is logged in and has authenticated your
                            // app
                            console.log("fb user already logged in");
                            deferred.resolve(response);
                        } else {
                            // the user is logged in to Facebook,
                            // but has not authenticated your app
                            FB.login(function (response) {
                                if (response.authResponse) {
                                    console.log("fb user logged in");
                                    resolve(null, response, deferred);
                                } else {
                                    console.log("fb user could not log in");
                                    resolve(response.error, null, deferred);
                                }
                            });
                        }
                    });

                    return deferred.promise;
                }

                return{
                    login: _login
                };
            }])
    .factory('latLngAddressLookup', function ($resource) {
        return $resource('https://maps.googleapis.com/maps/api/geocode/json?latlng=:latLng')
    });

coreApp.service('loadingScreenService', ['$rootScope', function ($rootScope) {
    var loadingCompleted = false

    this.getStatus = function () {
        return loadingCompleted
    }

    this.updateStatus = function (newStatus, $scope) {
        loadingCompleted = newStatus
        $rootScope.$broadcast('loadingStatusUpdate');
        return loadingCompleted
    }

}])
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


    }]).controller('findCtrl', ['$scope', '$routeParams', '$rootScope', function ($scope, $routeParams, $rootScope) {
        $rootScope.finderMap = {status: true}
        $scope.messages = {
            welcome: "Welcome to the search page"
        };
        var fm = this;
        fm.message = 'You can not hide. :)';
        fm.callbackFunc = function (param) {
            console.log('I know where ' + param + ' are. ' + vm.message);
            console.log('You are at' + vm.map.getCenter());
        };


    }])
    .controller('loadScreenCtrl', ['$scope', 'loadingScreenService', function ($scope, loadingScreenService) {


        $scope.$on('loadingStatusUpdate', function (event) {
            $scope.loading = {
                isComplete: loadingScreenService.getStatus()
            }
            console.log('hi: ' + loadingScreenService.getStatus())
        })

        $scope.loading = {
            isComplete: loadingScreenService.getStatus()
        }
    }])
    .controller('homeCtrl', ['$rootScope', '$scope', 'userDetails', '$http', '$location', '$cookies', '$routeParams', '$route', 'Restangular',
        'Facebook', 'loadingScreenService',
        function ($rootScope, $scope, userDetails, $http, $location, $cookies, $routeParams, $route, Restangular, Facebook, loadingScreenService) {


            getCookie('csrftoken')
            $scope.getUserDetails = function (next) {
                var nUser = userDetails.query();

                nUser.$promise.then(function (data) {
                    if (data[0].user != "False") {
                        $scope.u = data
                        $scope.userIsActive = data[0].fields.is_active
                        if (next != false) {
                            $location.path(next)
                        } else {
                            loadingScreenService.updateStatus(true)
                        }

                    } else {
                        $scope.u = false
                        loadingScreenService.updateStatus(true)
                    }


                },function () {
                    console.log('there was an error and no user was found')
                    $loadingScreenService.updateStatus(true)
                }).catch(function () {
                        loadingScreenService.updateStatus(true)
                    })
            }


            $scope.login_fb = function (next) {
                loadingScreenService.updateStatus(false)
                $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
                Facebook.login().then(function (response) {

                    var reqObj = {"access_token": response.authResponse.accessToken,
                        "backend": "facebook"};
                    var u_b = Restangular.all('/x/sociallogin/');

                    u_b.post(reqObj).then(function (response) {
                        //$location.path('/');
                        $scope.getUserDetails(next)

                    }, function (response) { /*error*/
                        console.log("There was an error", response);
                        //deal with error here.
                    });
                });
            }
            $scope.getUserDetails(false)

        }])


    .controller('createCtrl', ['NgMap', '$scope', '$rootScope', 'userDetails', '$location', 'partyPoster','loadingScreenService', function (NgMap, $scope, $rootScope, userDetails, $location, partyPoster, loadingScreenService) {
        $scope.currentPartyInfo = {
            "name": "",
            "location": "",
            "description": "",
            "start": '',
            "length": '',
            "active": true,
            "user": ''
        }
        $scope.addThisParty = function () {

            partyPoster.addNew($scope.currentPartyInfo)
            loadingScreenService.updateStatus(false)
            $location.path('/')
        }
        console.log('controlling')

        $rootScope.finderMap = {status: false}
        $scope.getUserDetails = function () {
            var nUser = userDetails.query();

            nUser.$promise.then(function (data) {

                console.log(data)
                if (data[0].user == "False") {
                    $location.path('/')

                } else {
                    $scope.currentPartyInfo.user = 'https://slick.local:3299/x/api/users/' + data[0].pk + '/'
                    loadingScreenService.updateStatus(true)

                }
            },function () {
                console.log('ERROR: there was an error and no user was found. Returning to Here Home')
                loadingScreenService.updateStatus(true)
                $location.path('/')
            }).catch(function () {
                    loadingScreenService.updateStatus(true)

                })
        }
        $scope.getUserDetails();
    }])


    .controller('MyCtrl', function (NgMap, $scope) {
        $scope.useAutoLocation = {
            status: 'auto'
        };
        $scope.partyLocation = {
            confirmed: false
        }
        $scope.creating = {
            name: 'Who are you?',
            desc: 'What are you doing?',
            start: '1:00PM',
            end: '4:00PM'
        }
        var vm = this;

        vm.positions = ['current-location'];
        $scope.address = 'current-location'
        NgMap.getMap().then(function (map) {
            vm.map = map;
        });
        vm.callbackFunc = function (param) {
            $scope.theLocation = vm.map.getCenter()
            console.log('You are at: ' + $scope.theLocation);


            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition);
            } else {
                console.log("Geolocation is not supported by this browser.")
            }


            function showPosition(position) {
                //console.log(position.coords.latitude + "," + position.coords.longitude)

                $scope.currentPartyInfo.location = "(" + position.coords.latitude + "," + position.coords.longitude + ")"
            }


        };

        vm.addMarker = function (event) {
            vm.positions = [];
            var ll = event.latLng;
            vm.positions.push(ll.lat() + ", " + ll.lng());
            //console.log(vm.positions)
            $scope.address = ''
            $scope.theLocation = "(" + ll.lat() + ", " + ll.lng() + ")"
            $scope.currentPartyInfo.location = "(" + ll.lat() + ", " + ll.lng() + ")"
            console.log('You are at' + $scope.theLocation);

        }
        vm.deleteMarkers = function () {
            vm.positions = [];
        };
        vm.findMe = function () {
            //vm.positions = ['current-location'];
            vm.positions = [];
            $scope.address = 'current-location'

        };
        vm.showMarkers = function () {
            for (var key in vm.map.markers) {
                vm.map.markers[key].setMap(vm.map);
            }
            ;
        };
        vm.hideMarkers = function () {
            for (var key in vm.map.markers) {
                vm.map.markers[key].setMap(null);
            }
            ;
        };
        vm.findLocationBy = function (newStatus) {
            if (newStatus == "map") {
                $scope.address = ''
                vm.positions = [];
            }
            if (newStatus == "auto") {
                $scope.address = 'current-location'
                vm.positions = ['current-location'];
            }
            console.log('Find location by: : ' + newStatus)
        }

    });

