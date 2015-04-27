var app = angular.module("surveyPlatform", ["ngRoute", "ngAnimate", "ngMaterial"]);

// app.config(['$routeProvider',
//     function($routeProvider) {
//         $routeProvider.when('/list', {
//             templateUrl: 'static/pages/popupList.html',
//             controller: 'listController'
//         }).otherwise({
//             redirectTo: '/list'
//         });
//     }
// ]);

app.service("resource", function() {
    this.createData = function(data) {
        this.data = data;
    }
    this.readData = function(index) {
        return this.data[index];
    }
    this.device = (function() {
        var isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i);
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i);
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i);
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            },
            any: function() {
                return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
            }
        };

        if (isMobile.Android()) {
            return {
                "android": ["android_deeplink", "googleplay_url"]
            };
        } else if (isMobile.iOS()) {
            return {
                "ios": ["ios_deeplink", "iTunes_url"]
            };
        } else {
            return {
                "else": []
            };
        }
    })();
    this.pickImage = function(name) {
        switch (name) {
            case "beat":
                return "static/images/Beat.png";

            case "navermusic":
                return 'static/images/Navermusic.png';

            case "youtube":
                return 'static/images/Youtube.png';

            case "melon":
                return 'static/images/Melon.png';

            case "bugs":
                return 'static/images/Bugs.png';

        }
        // 'static/images/Soundcloud.png'
    }
    this.createGridData = function(data) {
        this.gridData = data;
    }
    this.readGridData = function() {
        return this.gridData;
    }
    return this;
});

app.controller("AppCtrl", ["$scope", "$rootScope", "$timeout", "$mdSidenav", "$log", "$http", "$animate", "$mdBottomSheet", "resource",
    function($scope, $rootScope, $timeout, $mdSidenav, $log, $http, $animate, $mdBottomSheet, resource) {
        $scope.results = [];
        $scope.searchQuery = undefined;
        $scope.resultsNumber = undefined;
        $scope.index = undefined;

        $("#progress-circular").hide();

        $scope.toggleLeft = function() {
            $mdSidenav('left').toggle().then(function() {
                $log.debug("toggle LEFT is done");
            });
        };

        $scope.executeSearch = function() {
            $("#progress-circular").show(500);

            // function angular.callbacks._0(data){
            //     console.log("inside callback", data);
            // }

            $http({
                method: 'jsonp',
                url: "http://tehranslippers.com:5000/result?type=music&query=" + $scope.searchQuery + "&callback=JSON_CALLBACK",
                responseType: "json"
            }).
            success(function(data, status, headers, config) {
                $("#progress-circular").hide(500);
                $scope.resultsNumber = data.length;
                $scope.results = data;
                resource.createData(data);
            }).
            error(function(data, status, headers, config) {});
        }

        $scope.showBottomGrid = function($event) {
            var selectedData = resource.readData($scope.index);
            var gridItems = [];
            selectedData["deep_links"].forEach(function(item, index) {
                var gridItem = {};
                gridItem.name = item["name"];
                gridItem.image = resource.pickImage(item["name"]);
                if (resource.device["android"]) {
                    gridItem.device = "android";
                    gridItem.deeplink = item[resource.device["android"][0]];
                    gridItem.marketlink = item[resource.device["android"][1]];
                } else if (resource.device["ios"]) {
                    gridItem.device = "ios";
                    gridItem.deeplink = item[resource.device["ios"][0]];
                    gridItem.marketlink = item[resource.device["ios"][1]];
                }
                gridItems.push(gridItem);
            });
            resource.createGridData(gridItems);
            $mdBottomSheet.show({
                templateUrl: './static/pages/bottomGrid.html',
                controller: 'bottomGridController',
                targetEvent: $event
            }).then(function(clickedItem) {
                console.log(resource.readGridData());
            });
        };
    }
]);

app.controller('LeftCtrl', function($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function() {
        $mdSidenav('left').close().then(function() {
            $log.debug("close LEFT is done");
        });
    };
});

app.controller('bottomGridController', ["$scope", "$rootScope", "$mdBottomSheet", "$window", "resource",
    function($scope, $rootScope, $mdBottomSheet, $window, resource) {
        $scope.items = resource.readGridData();
        $scope.listItemClick = function($index, name, deeplink, marketlink) {
            if (resource.device["android"]) {
                if (navigator.userAgent.match(/Chrome/)) {
                    // chrome
                    if(name === "navermusic"){
                        $window.location.href = deeplink;
                    } else {
                        window.setTimeout(function(){
                            $window.location.href = marketlink;
                        }, 1000)
                        $window.location.href = deeplink;
                    }
                } else if (navigator.userAgent.match(/Firefox/)) {
                    // firefox
                    document.location = deeplink;
                    window.setTimeout(function () {
                        document.location = marketlink;
                    }, 1000);
                } else {
                    // other browsers
                    window.setTimeout(function() {
                        document.getElementById("loader").src = marketlink;
                    }, 1000);
                    document.getElementById("loader").src = deeplink;
                }
            } else if (resource.device["ios"]) {
                window.setTimeout(function() {
                    document.getElementById("loader").src = marketlink;
                }, 1000);
                document.getElementById("loader").src = deeplink;
            }
        };
        $scope.noItem = function(){
            return $scope.items.length === 0;
        };
    }
]);
