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

var currentUser = false
var globalMessages = false

var coreApp = angular.module('coreApp', ['ngRoute', 'ngCookies', 'ngResource', 'ngStorage', 'restangular'], function ($httpProvider) {
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';

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
    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'core/home.html',
                    controller: 'homeCtrl'
                }).when('/about', {
                    templateUrl: 'core/about.html',
                    controller: 'aboutCtrl'
                }).otherwise({
                    redirectTo: '/'
                });
        }
    ])


    .run(function ($rootScope, $location, $http, $cookies) {
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        $rootScope.$watch(function () {
                return $location.path();
            },
            function (a) {
                //  console.log('url has changed: ' + a);
                fullPath = $location.path();

            });
    });


coreApp
    .factory('userDetails', function ($resource, $location) {
        return $resource('/x/u', {
            'query': {method: 'GET', isArray: false }
        });
    })
    .factory('corecms', function ($resource) {
        return $resource(
            'https://slick.local:3299/x/core/content',
            {format: 'json'},
            { 'query': {method: 'GET', isArray: true} })
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
            }]);

coreApp
    .service('messageService', ['$resource', function ($resource) {

        return $resource(
            '/x/core/content',
            {format: 'json'},
            { 'query': {method: 'GET', isArray: true} })


    }])
    .service('getAllMessages', ['$rootScope', 'messageService', function ($rootScope, messageService) {

        var incomingMessages
        if (globalMessages == false) {
            var content = messageService.query();
            content.$promise.then(function (data) {


                globalMessages = data
                incomingMessages = data
                console.log(data)
                $rootScope.$broadcast('myEvent', data);


            })
        }
        this.getEm = function () {

            return incomingMessages
        }
    }])


coreApp
    .controller('templateCtrl', ['$scope', function ($scope) {
        $scope.templates =
            [
                { name: 'navTemplate', url: 'nav.html'}
            ];
        $scope.navTemplate = $scope.templates[0];

    }])

    .controller('navCtrl', ['$rootScope', '$scope', 'userDetails', '$http', '$location', '$cookies', '$routeParams', '$route', 'Restangular',
        'Facebook', 'getAllMessages',
        function ($rootScope, $scope, userDetails, $http, $location, $cookies, $routeParams, $route, Restangular, Facebook, getAllMessages) {

            setCookie('uas', false, 0)

            var fullPath = $location.path();
            $scope.urlPath = {
                'navPath': fullPath.split("/")[1]
            }

            $scope.$on('$locationChangeStart', function (event) {

                var fullPath = $location.path();
                $scope.urlPath = {
                    'navPath': fullPath.split("/")[1]
                }

            });
            $scope.messages = getAllMessages.getEm()
            $scope.getUserDetails = function () {
                var nUser = userDetails.query();

                nUser.$promise.then(function (data) {

                    //console.log("from navCtrl: " + data)

                    if (data[0].user != "False") {
                        $scope.u = data
                        $scope.nav = {userNav: data[0].fields.first_name};
                        $scope.navItems = {
                            projects: 'Projects',
                            admin: 'Admin',
                            logout: 'Logout'

                        }
                        setCookie('uas', true, 7)

                    } else {
                        $scope.u = false
                        setCookie('uas', false, 0)
                    }
                    $scope.loading = {
                        isComplete: true}


                },function () {
                    console.log('there was an error and no user was found')
                    $scope.loading = {
                        isComplete: true}
                }).catch(function () {
                        $scope.loading = {
                            isComplete: true}
                    })
            }


            $scope.login_fb = function () {
                $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
                Facebook.login().then(function (response) {
                    //we come here only if JS sdk login was successful so lets
                    //make a request to our new view. I use Restangular, one can
                    //use regular http request as well.
                    var reqObj = {"access_token": response.authResponse.accessToken,
                        "backend": "facebook"};
                    var u_b = Restangular.all('/x/sociallogin/');

                    u_b.post(reqObj).then(function (response) {
                        //$location.path('/');
                        $scope.getUserDetails()

                    }, function (response) { /*error*/
                        console.log("There was an error", response);
                        //deal with error here.
                    });
                });
            }
            //  console.log(document.cookie)
            if (getCookie('uas')) {
                console.log("uas cookie is " + getCookie('uas'))
            } else {
                $scope.getUserDetails()
            }


        }])
    .controller('aboutCtrl', ['$scope', '$location', 'userDetails', 'messageService', 'getAllMessages', function ($scope, $location, userDetails, messageService, getAllMessages) {


        $scope.tryToGetUserData = function () {
            $scope.currentUser2 = {
                u: "Please Authenticate"
            }
            console.log('try again to get user data: ' + $location.host())
            var nUser = userDetails.query();

            nUser.$promise.then(function (data) {

                console.log("from homeCtrl: " + data)

                if (data != "False") {
                    $scope.currentUser2 = {
                        u: data[0].fields.first_name
                    }
                    //$scope.u = data
                    //$scope.nav = {userNav: data[0].fields.first_name};
                } else {

                }
            })
        }

        /** $scope.getAllContent = function () {
            if (globalMessages == false) {
                var content = messageService.query();
                content.$promise.then(function (data) {

                    $scope.messages = data
                    globalMessages = $scope.messages

                })
            } else {
                $scope.messages = globalMessages
            }
        }
         $scope.getAllContent()**/
            $scope.messages = getAllMessages.getEm()
        $scope.$on('myEvent', function (even, data) {
            $scope.messages = globalMessages


        })

    }])
    .controller('homeCtrl', ['$scope', '$location', '$routeParams', 'corecms', 'messageService', 'getAllMessages',
        function ($scope, $location, $routeParams, corecms, messageService, getAllMessages) {
            $scope.messages = getAllMessages.getEm()
            $scope.$on('myEvent', function (even, data) {
                $scope.messages = globalMessages


            })


        }]);

