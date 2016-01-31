var currentUser = false

var coreApp = angular.module('coreApp', ['ngRoute', 'ngCookies', 'ngResource', 'ngStorage'], function ($httpProvider) {
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
    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'core/home.html',
                    controller: 'contentCtrl'
                }).when('/about', {
                    templateUrl: 'core/about.html',
                    controller: 'contentCtrl'
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
                console.log('url has changed: ' + a);
                fullPath = $location.path();

            });
    });


coreApp
    .factory('userDetails', function ($resource, $location) {
        return $resource('https://'+$location.host()+'/x/u', {
            'query': {method: 'GET', isArray: false }
        });
    });

coreApp
    .controller('templateCtrl', ['$scope', function ($scope) {
        $scope.templates =
            [
                { name: 'navTemplate', url: 'nav.html'}
            ];
        $scope.navTemplate = $scope.templates[0];

    }])

    .controller('navCtrl', ['$rootScope', '$scope', 'userDetails', '$location', '$routeParams', '$route',
        function ($rootScope, $scope, userDetails, $location, $routeParams, $route) {

        var nUser = userDetails.query();
        console.log("trying to get user data from" + 'https://'+$location.host()+'/x/u')
        nUser.$promise.then(function (data) {

            console.log("from navCtrl: " + data)

            if (data != "False") {
                $scope.u = data
                $scope.nav = {userNav: data[0].fields.first_name};
            } else {
                $scope.u = false
            }
        })
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


    }])

    .controller('contentCtrl', ['$scope', '$location', '$routeParams', function ($scope, $location, $routeParams) {


        $scope.messages = {
            home: "wannabe",
            about: "coming soon",
            two: "Who knows Latin? Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            aboutSubOne: "A message from testApp.js"

        };


    }]);

